import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  IGeozoneRepositoryToken,
  type IGeozoneRepository,
} from 'src/modules/geozone/repositories/geozone.repository.interface';
import {
  ITelemetryRepositoryToken,
  type ITelemetryRepository,
} from 'src/modules/telemetry/repositories/telemetry.repository.interface';
import { getTelemetryConfig } from 'src/modules/telemetry/common/telemetry.config';
import {
  ITripPricingJobQueueToken,
  type ITripPricingJobQueue,
} from 'src/shared/background/trip-pricing-job-queue.interface';
import { Throttle } from 'src/shared/throttle/throttle';

import { TripMapper } from '../common/mapper';
import type { TripRead } from '../entities/dtos/trip.read';
import { TripStatus } from '../entities/trip.status';
import {
  ITripRepositoryToken,
  type ITripRepository,
} from '../repositories/trip.repository.interface';
import {
  ITripRealtimePublisherToken,
  type ITripRealtimePublisher,
} from '../services/trip-realtime.publisher.interface';
import { calculateTripPricing } from './trip-pricing.calculator';
import {
  TripPricingJobName,
  type TripPricingRecalcTrigger,
} from './trip-pricing-jobs';
import { shouldSkipTelemetryRecalc } from './handlers/trip-pricing-recalc.handler';
import type {
  ITripPricingService,
  TripPricingRecalcOptions,
} from './trip-pricing.service.interface';

@Injectable()
export class TripPricingService implements ITripPricingService {
  private readonly logger = new Logger(TripPricingService.name);

  private readonly enqueueThrottle = new Throttle();

  private readonly wsMetricsThrottle = new Throttle();

  constructor(
    @Inject(ITripRepositoryToken)
    private readonly trips: ITripRepository,
    @Inject(IGeozoneRepositoryToken)
    private readonly geozones: IGeozoneRepository,
    @Inject(ITelemetryRepositoryToken)
    private readonly telemetry: ITelemetryRepository,
    @Inject(ITripPricingJobQueueToken)
    private readonly pricingQueue: ITripPricingJobQueue,
    @Inject(ITripRealtimePublisherToken)
    private readonly realtimePublisher: ITripRealtimePublisher,
  ) {}

  enqueueRecalc(tripId: string, trigger: TripPricingRecalcTrigger): void {
    const { periodSec } = getTelemetryConfig();
    if (trigger === 'telemetry') {
      const allowed = this.enqueueThrottle.allow(
        `pricing:trip:${tripId}`,
        periodSec * 1000,
      );
      if (!allowed) {
        return;
      }
    }

    this.pricingQueue.enqueue({
      name: TripPricingJobName.Recalc,
      payload: { tripId, trigger },
      createdAtMs: Date.now(),
    });
  }

  async recalcAndPersist(
    tripId: string,
    options: TripPricingRecalcOptions,
  ): Promise<TripRead | null> {
    const trip = await this.trips.findById(tripId);
    if (!trip) {
      this.logger.warn(`skip pricing: trip not found tripId=${tripId}`);
      return null;
    }

    if (shouldSkipTelemetryRecalc(trip.status, options.trigger)) {
      this.logger.debug(
        `skip pricing telemetry for terminal trip tripId=${tripId} status=${trip.status}`,
      );
      return null;
    }

    if (
      trip.status === TripStatus.CANCELLED &&
      options.trigger !== 'finish'
    ) {
      return null;
    }

    const rates = await this.geozones.findVersionPricingSnapshot(
      trip.geoZoneVersionId,
    );
    if (!rates) {
      this.logger.warn(
        `skip pricing: geo version rates not found versionId=${trip.geoZoneVersionId}`,
      );
      return null;
    }

    const points = await this.telemetry.findManyByTripId(
      tripId,
      undefined,
      undefined,
      undefined,
      undefined,
      'asc',
    );
    const asOf = new Date();
    const result = calculateTripPricing({
      trip: {
        status: trip.status,
        startedAt: trip.startedAt,
        finishedAt: trip.finishedAt,
        pauseStartedAt: trip.pauseStartedAt,
        totalPausedSec: trip.totalPausedSec,
      },
      rates,
      telemetryPoints: points.map((p) => ({ lat: p.lat, lon: p.lon })),
      asOf,
    });

    const updated = await this.trips.update(tripId, {
      distanceMeters: result.distanceMeters,
      chargedMinutes: result.chargedMinutes,
      chargedKm: result.chargedKm,
      priceTime: result.priceTime,
      priceDistance: result.priceDistance,
      pricePause: result.pricePause,
      priceTotal: result.priceTotal,
      distance: result.distance,
      duration: result.duration,
    });

    const read = TripMapper.fromEntityToRead(updated);

    if (options.publishMetrics) {
      await this.publishMetricsIfAllowed(read);
    }

    return read;
  }

  private async publishMetricsIfAllowed(trip: TripRead): Promise<void> {
    const { periodSec } = getTelemetryConfig();
    const allowed = this.wsMetricsThrottle.allow(
      `ws_metrics:trip:${trip.id}`,
      periodSec * 1000,
    );
    if (!allowed) {
      return;
    }
    try {
      await this.realtimePublisher.publishTripMetricsUpdated(trip);
    } catch (error) {
      this.logger.warn(
        `publish trip.metrics.updated failed tripId=${trip.id}`,
        error,
      );
    }
  }
}
