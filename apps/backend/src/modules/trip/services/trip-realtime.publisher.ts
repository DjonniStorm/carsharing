import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import type { TripRead } from '../entities/dtos/trip.read';
import { TripWsEvent } from '../entities/realtime/trip-event';
import { createTripWsEvent } from '../realtime/trip-events.emitter';
import { TripStateChangedPayload } from '../realtime/trip-events.payloads';
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
    const payload: TripStateChangedPayload = {
      tripId: trip.id,
      carId: trip.carId,
      status: trip.status,
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
}

