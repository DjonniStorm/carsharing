import type { ViolationEntity } from '../entities/violation.entity';

/**
 * Порт публикации realtime-событий по нарушениям.
 * Реализация на первом шаге может быть no-op/logging, позже — адаптер на WS/outbox/broker.
 */
export interface IViolationRealtimePublisher {
  publishViolationCreated(violation: ViolationEntity): Promise<void>;
  publishViolationUpdated(violation: ViolationEntity): Promise<void>;
}

export const IViolationRealtimePublisherToken = Symbol(
  'IViolationRealtimePublisher',
);

