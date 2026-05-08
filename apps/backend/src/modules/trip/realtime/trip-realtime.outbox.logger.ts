import { Inject, Injectable, Logger } from '@nestjs/common';

import type { ITripRealtimeOutbox } from './trip-realtime.outbox.interface';
import type {
  TripWsEnvelope,
  TripWsEventPayloadMap,
} from './trip-events.payloads';
import {
  type ITripGateway,
  ITripGatewayToken,
} from '../gateways/trip.gateway.interface';

/** Реальный outbox: отправляет событие в websocket gateway и логирует доставку. */
@Injectable()
export class LoggerTripRealtimeOutbox implements ITripRealtimeOutbox {
  private readonly logger = new Logger(LoggerTripRealtimeOutbox.name);
  constructor(
    @Inject(ITripGatewayToken)
    private readonly tripGateway: ITripGateway,
  ) {}

  async publish<E extends keyof TripWsEventPayloadMap>(
    event: TripWsEnvelope<E, TripWsEventPayloadMap[E]>,
  ): Promise<void> {
    this.tripGateway.publish(event);
    this.logger.debug(
      `event=${event.event} id=${event.eventId} scope=${event.channelScope}`,
    );
  }
}
