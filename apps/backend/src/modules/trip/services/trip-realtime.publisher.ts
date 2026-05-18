import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import type { TripRead } from '../entities/dtos/trip.read';
import type { TripStatus } from '../entities/trip.status';
import { TripWsEvent } from '../entities/realtime/trip-event';
import { createTripWsEvent } from '../realtime/trip-events.emitter';
import type {
  TripFinishedPayload,
  TripMetricsUpdatedPayload,
  TripStateChangedPayload,
} from '../realtime/trip-events.payloads';
import {
  ITripRealtimeOutboxToken,
  type ITripRealtimeOutbox,
} from '../realtime/trip-realtime.outbox.interface';
import type { ITripRealtimePublisher } from './trip-realtime.publisher.interface';

@Injectable()
export class TripRealtimePublisher implements ITripRealtimePublisher {
  private readonly logger = new Logger(TripRealtimePublisher.name);

  constructor(
    @Inject(ITripRealtimeOutboxToken)
    private readonly outbox: ITripRealtimeOutbox,
  ) {}

  async publishTripStarted(trip: TripRead): Promise<void> {
    await this.publishTripStateChanged(trip);
  }

  async publishTripStateChanged(
    trip: TripRead,
    previousStatus?: TripStatus,
  ): Promise<void> {
    const payload: TripStateChangedPayload = {
      tripId: trip.id,
      carId: trip.carId,
      status: trip.status,
      previousStatus,
      ts: new Date().toISOString(),
    };
    const event = createTripWsEvent(TripWsEvent.TripStateChanged, payload, {
      eventId: uuidv4(),
      ts: payload.ts,
    });
    await this.outbox.publish(event);
    this.logger.debug(
      `published event=${event.event} tripId=${trip.id} eventId=${event.eventId}`,
    );
  }

  async publishTripMetricsUpdated(trip: TripRead): Promise<void> {
    const ts = new Date().toISOString();
    const payload: TripMetricsUpdatedPayload = {
      tripId: trip.id,
      carId: trip.carId,
      distanceMeters: trip.distanceMeters,
      chargedMinutes: trip.chargedMinutes,
      chargedKm: trip.chargedKm,
      priceTime: trip.priceTime,
      priceDistance: trip.priceDistance,
      pricePause: trip.pricePause,
      priceTotal: trip.priceTotal,
      ts,
    };
    const event = createTripWsEvent(TripWsEvent.TripMetricsUpdated, payload, {
      eventId: uuidv4(),
      ts,
    });
    await this.outbox.publish(event);
    this.logger.debug(
      `published event=${event.event} tripId=${trip.id} eventId=${event.eventId}`,
    );
  }

  async publishTripFinished(trip: TripRead): Promise<void> {
    const ts = new Date().toISOString();
    const payload: TripFinishedPayload = {
      tripId: trip.id,
      carId: trip.carId,
      finishedAt: trip.finishedAt?.toISOString() ?? ts,
      distanceMeters: trip.distanceMeters,
      chargedMinutes: trip.chargedMinutes,
      chargedKm: trip.chargedKm,
      priceTotal: trip.priceTotal,
      ts,
    };
    const event = createTripWsEvent(TripWsEvent.TripFinished, payload, {
      eventId: uuidv4(),
      ts,
    });
    await this.outbox.publish(event);
    this.logger.debug(
      `published event=${event.event} tripId=${trip.id} eventId=${event.eventId}`,
    );
  }
}
