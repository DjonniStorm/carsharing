import type { ViolationEntity } from '../entities/violation.entity';

export interface IViolationRealtimePublisher {
  publishViolationCreated(violation: ViolationEntity): Promise<void>;
  publishViolationUpdated(violation: ViolationEntity): Promise<void>;
}

export const IViolationRealtimePublisherToken = Symbol(
  'IViolationRealtimePublisher',
);
