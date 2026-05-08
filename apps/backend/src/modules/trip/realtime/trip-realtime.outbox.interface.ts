import type {
  TripWsEnvelope,
  TripWsEventPayloadMap,
} from './trip-events.payloads';

/**
 * Порт транспорта realtime-событий.
 * Позже может быть адаптер на WebSocket Gateway, Redis Pub/Sub, NATS и т.д.
 */
export interface ITripRealtimeOutbox {
  publish<E extends keyof TripWsEventPayloadMap>(
    event: TripWsEnvelope<E, TripWsEventPayloadMap[E]>,
  ): Promise<void>;
}

export const ITripRealtimeOutboxToken = Symbol('ITripRealtimeOutbox');

