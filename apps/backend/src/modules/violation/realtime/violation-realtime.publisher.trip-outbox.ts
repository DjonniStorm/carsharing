import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import {
  ITripRepositoryToken,
  type ITripRepository,
} from '../../trip/repositories/trip.repository.interface';
import {
  ITripRealtimeOutboxToken,
  type ITripRealtimeOutbox,
} from '../../trip/realtime/trip-realtime.outbox.interface';
import { TripWsEvent } from '../../trip/entities/realtime/trip-event';
import { createTripWsEvent } from '../../trip/realtime/trip-events.emitter';
import {
  ViolationCreatedPayload,
  ViolationUpdatedPayload,
} from '../../trip/realtime/trip-events.payloads';
import type { ViolationEntity } from '../entities/violation.entity';
import type { IViolationRealtimePublisher } from './violation-realtime.publisher.interface';
import { violationSeverityForWs } from '../common/violation-ws-severity';

/**
 * Реализация IViolationRealtimePublisher поверх общего trip-outbox => TripGateway.
 *
 * Пример комнаты на клиенте (manager подписан на поездку):
 * ```
 * socket.emit('subscribe.trip', { tripId })
 * // сервер кладёт сокет в room `trip:{tripId}` => приходит envelope `violation.created`
 * ```
 */
@Injectable()
export class ViolationTripRealtimePublisher implements IViolationRealtimePublisher {
  private readonly logger = new Logger(ViolationTripRealtimePublisher.name);

  constructor(
    @Inject(ITripRealtimeOutboxToken)
    private readonly outbox: ITripRealtimeOutbox,
    @Inject(ITripRepositoryToken)
    private readonly trips: ITripRepository,
  ) {}

  async publishViolationCreated(violation: ViolationEntity): Promise<void> {
    const trip = await this.trips.findById(violation.tripId);
    if (!trip) {
      this.logger.warn(
        `skip violation.created WS: trip not found tripId=${violation.tripId}`,
      );
      return;
    }
    const ts = violation.createdAt.toISOString();
    const payload: ViolationCreatedPayload = {
      violationId: violation.id,
      tripId: violation.tripId,
      carId: trip.carId,
      type: violation.type as unknown as number,
      severity: violationSeverityForWs(violation.type),
      description: violation.description,
      ts,
    };
    const event = createTripWsEvent(TripWsEvent.ViolationCreated, payload, {
      eventId: uuidv4(),
      ts,
    });
    await this.outbox.publish(event);
  }

  async publishViolationUpdated(violation: ViolationEntity): Promise<void> {
    const trip = await this.trips.findById(violation.tripId);
    if (!trip) {
      this.logger.warn(
        `skip violation.updated WS: trip not found tripId=${violation.tripId}`,
      );
      return;
    }
    const ts = new Date().toISOString();
    const payload: ViolationUpdatedPayload = {
      violationId: violation.id,
      tripId: violation.tripId,
      carId: trip.carId,
      type: violation.type as unknown as number,
      description: violation.description,
      ts,
    };
    const event = createTripWsEvent(TripWsEvent.ViolationUpdated, payload, {
      eventId: uuidv4(),
      ts,
    });
    await this.outbox.publish(event);
  }
}
