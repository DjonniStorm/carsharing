import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { ViolationRepository } from '../repositories/violation.repository';
import { REPOSITORY_TOKENS } from '../../../shared/tokens/repository.tokens';
import {
  DOMAIN_EVENTS,
  ViolationCreatedEvent,
} from '../../../shared/events/domain.events';
import { CreateViolationInput } from '../../../shared/types/repository.types';

@Injectable()
export class ViolationService {
  constructor(
    @Inject(REPOSITORY_TOKENS.violation)
    private readonly violationRepository: ViolationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createViolation(data: CreateViolationInput) {
    this.assertCreateViolationInput(data);
    const violation = await this.violationRepository.create(data);
    const payload: ViolationCreatedEvent = {
      violationId: violation.id,
      tripId: violation.tripId,
      createdAt: new Date(),
    };
    this.eventEmitter.emit(DOMAIN_EVENTS.violationCreated, payload);
    return violation;
  }

  async detectViolation(input?: { tripId?: number; type?: string; trigger?: boolean }) {
    if (!input) {
      return null;
    }
    if (!Number.isInteger(input.tripId) || (input.tripId ?? 0) <= 0) {
      throw new Error('Invalid tripId');
    }
    if (!['OUT_OF_ZONE', 'SPEEDING', 'OTHER'].includes(input.type ?? '')) {
      throw new Error('Invalid violation type');
    }
    if (!input.trigger) {
      return null;
    }
    return this.createViolation({
      tripId: input.tripId!,
      type: input.type as 'OUT_OF_ZONE' | 'SPEEDING' | 'OTHER',
    });
  }

  async getViolations() {
    return this.violationRepository.findAll();
  }

  private assertCreateViolationInput(data: CreateViolationInput): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Violation payload must be an object');
    }
    if (!Number.isInteger(data.tripId) || data.tripId <= 0) {
      throw new Error('Invalid tripId');
    }
    if (!['OUT_OF_ZONE', 'SPEEDING', 'OTHER'].includes(data.type)) {
      throw new Error('Invalid violation type');
    }
  }
}
