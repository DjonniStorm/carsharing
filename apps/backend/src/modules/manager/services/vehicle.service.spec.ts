import { EventEmitter2 } from '@nestjs/event-emitter';
import { VehicleService } from './vehicle.service';
import { VehicleRepository } from '../repositories/vehicle.repository';

describe('VehicleService', () => {
  let service: VehicleService;
  let repository: jest.Mocked<VehicleRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findNearby: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    };
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    service = new VehicleService(repository, eventEmitter);
  });

  describe('createVehicle', () => {
    describe('valid cases', () => {
      it('calls repository.create with valid input', async () => {
        // arrange
        const input = {
          brand: 'Tesla',
          model: 'Model 3',
          plateNumber: 'AA1111AA',
          status: 'ACTIVE' as const,
          location: { lat: 50.45, lon: 30.52 },
        };
        repository.create.mockResolvedValue({
          id: 1,
          ...input,
          deletedAt: null,
        });

        // act
        const result = await service.createVehicle(input);

        // assert
        expect(repository.create).toHaveBeenCalledWith(input);
        expect(result.id).toBe(1);
      });
    });

    describe('invalid inputs', () => {
      it.each([
        {
          label: 'missing brand',
          payload: {
            brand: '',
            model: 'M',
            plateNumber: 'AA',
            status: 'ACTIVE',
            location: { lat: 1, lon: 2 },
          },
        },
        {
          label: 'missing model',
          payload: {
            brand: 'B',
            model: '',
            plateNumber: 'AA',
            status: 'ACTIVE',
            location: { lat: 1, lon: 2 },
          },
        },
        {
          label: 'missing plateNumber',
          payload: {
            brand: 'B',
            model: 'M',
            plateNumber: '',
            status: 'ACTIVE',
            location: { lat: 1, lon: 2 },
          },
        },
        {
          label: 'invalid status',
          payload: {
            brand: 'B',
            model: 'M',
            plateNumber: 'AA',
            status: 'WRONG',
            location: { lat: 1, lon: 2 },
          },
        },
        {
          label: 'null location',
          payload: {
            brand: 'B',
            model: 'M',
            plateNumber: 'AA',
            status: 'ACTIVE',
            location: null,
          },
        },
      ])('throws for $label', async ({ payload }) => {
        // act + assert
        await expect(service.createVehicle(payload as never)).rejects.toThrow();
        expect(repository.create).not.toHaveBeenCalled();
      });

      it('fails deterministically on multiple invalid fields', async () => {
        // arrange
        const payload = {
          brand: '',
          model: null,
          plateNumber: '',
          status: 'NOPE',
          location: { lat: Number.NaN, lon: 2 },
        };

        // act + assert
        await expect(service.createVehicle(payload as never)).rejects.toThrow();
        expect(repository.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('softDeleteVehicle', () => {
    it('calls repository.softDelete for existing entity', async () => {
      // arrange
      repository.findById.mockResolvedValue({ id: 1 } as never);
      repository.softDelete.mockResolvedValue({ id: 1 } as never);

      // act
      await service.softDeleteVehicle(1);

      // assert
      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.softDelete).toHaveBeenCalledWith(1);
    });

    it('throws for non-existing entity', async () => {
      // arrange
      repository.findById.mockResolvedValue(null);

      // act + assert
      await expect(service.softDeleteVehicle(99)).rejects.toThrow(
        'Vehicle not found',
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('restoreVehicle', () => {
    it('restores when entity is deleted', async () => {
      // arrange
      repository.findById.mockResolvedValue({
        id: 1,
        deletedAt: new Date(),
      } as never);
      repository.restore.mockResolvedValue({ id: 1, deletedAt: null } as never);

      // act
      await service.restoreVehicle(1);

      // assert
      expect(repository.restore).toHaveBeenCalledWith(1);
    });

    it('returns current entity when it is not deleted', async () => {
      // arrange
      const entity = { id: 1, deletedAt: null } as never;
      repository.findById.mockResolvedValue(entity);

      // act
      const result = await service.restoreVehicle(1);

      // assert
      expect(result).toBe(entity);
      expect(repository.restore).not.toHaveBeenCalled();
    });
  });

  describe('updatePosition', () => {
    it('emits event exactly once with payload on success', async () => {
      // arrange
      repository.findById.mockResolvedValue({ id: 11 } as never);

      // act
      await service.updatePosition(11, 50.45, 30.52);

      // assert
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith('vehicle.updated', {
        vehicleId: 11,
        lat: 50.45,
        lon: 30.52,
      });
    });

    it('does not emit event on failure', async () => {
      // arrange
      repository.findById.mockResolvedValue(null);

      // act + assert
      await expect(service.updatePosition(11, 50.45, 30.52)).rejects.toThrow(
        'Vehicle not found',
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
