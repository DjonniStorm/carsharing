import { EventEmitter2 } from '@nestjs/event-emitter';
import { ViolationRepository } from '../repositories/violation.repository';
import { ViolationService } from './violation.service';

describe('ViolationService', () => {
  let service: ViolationService;
  let repository: jest.Mocked<ViolationRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    service = new ViolationService(repository, eventEmitter);
  });

  describe('createViolation', () => {
    it('calls repository and emits event for valid input', async () => {
      // arrange
      const payload = { tripId: 10, type: 'SPEEDING' as const };
      repository.create.mockResolvedValue({ id: 77, ...payload, createdAt: new Date() });

      // act
      const result = await service.createViolation(payload);

      // assert
      expect(repository.create).toHaveBeenCalledWith(payload);
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'violation.created',
        expect.objectContaining({ violationId: 77, tripId: 10 }),
      );
      expect(result.id).toBe(77);
    });

    it.each([
      { label: 'invalid type', payload: { tripId: 10, type: 'BAD' } },
      { label: 'missing tripId', payload: { tripId: 0, type: 'OTHER' } },
      { label: 'wrong tripId type', payload: { tripId: '10', type: 'OTHER' } },
    ])('rejects for $label', async ({ payload }) => {
      // act + assert
      await expect(service.createViolation(payload as never)).rejects.toThrow();
      expect(repository.create).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('detectViolation', () => {
    it('returns violation for valid scenario', async () => {
      // arrange
      repository.create.mockResolvedValue({ id: 5, tripId: 20, type: 'OUT_OF_ZONE', createdAt: new Date() });

      // act
      const result = await service.detectViolation({ tripId: 20, type: 'OUT_OF_ZONE', trigger: true });

      // assert
      expect(result).not.toBeNull();
      expect(repository.create).toHaveBeenCalled();
    });

    it('returns null when trigger is false', async () => {
      // act
      const result = await service.detectViolation({ tripId: 20, type: 'OUT_OF_ZONE', trigger: false });

      // assert
      expect(result).toBeNull();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('handles invalid data safely', async () => {
      // act + assert
      await expect(service.detectViolation({ tripId: -1, type: 'OUT_OF_ZONE', trigger: true })).rejects.toThrow(
        'Invalid tripId',
      );
      expect(repository.create).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
