import { EventEmitter2 } from '@nestjs/event-emitter';
import { VehicleRepository } from '../../manager/repositories/vehicle.repository';
import { TripRepository } from '../repositories/trip.repository';
import { TripService } from './trip.service';

describe('TripService', () => {
  let service: TripService;
  let tripRepository: jest.Mocked<TripRepository>;
  let vehicleRepository: jest.Mocked<VehicleRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    tripRepository = {
      findById: jest.fn(),
      findByDriverId: jest.fn(),
      findActiveByVehicleId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    vehicleRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findNearby: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    };
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    service = new TripService(tripRepository, vehicleRepository, eventEmitter);
  });

  describe('startTrip', () => {
    describe('valid cases', () => {
      it('creates trip and emits trip.started', async () => {
        // arrange
        const payload = {
          driverId: 5,
          vehicleId: 10,
          tariffId: 3,
          status: 'ACTIVE' as const,
          startTime: new Date('2026-04-17T10:00:00Z'),
          startLocation: { lat: 50.45, lon: 30.52 },
        };
        vehicleRepository.findById.mockResolvedValue({
          id: 10,
          status: 'ACTIVE',
        } as never);
        tripRepository.findByDriverId.mockResolvedValue([]);
        tripRepository.findActiveByVehicleId.mockResolvedValue(null);
        tripRepository.create.mockResolvedValue({
          id: 100,
          ...payload,
          endTime: null,
          endLocation: null,
        });

        // act
        const result = await service.startTrip(payload);

        // assert
        expect(tripRepository.create).toHaveBeenCalledWith(payload);
        expect(vehicleRepository.update).toHaveBeenCalledWith(10, {
          status: 'IN_USE',
        });
        expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(eventEmitter.emit).toHaveBeenCalledWith('trip.started', {
          tripId: 100,
          driverId: 5,
          vehicleId: 10,
          startedAt: payload.startTime,
        });
        expect(result.id).toBe(100);
      });
    });

    describe('invalid cases', () => {
      it.each([
        {
          label: 'missing vehicleId',
          payload: {
            driverId: 5,
            vehicleId: 0,
            tariffId: 1,
            status: 'ACTIVE',
            startTime: new Date(),
            startLocation: { lat: 1, lon: 2 },
          },
        },
        {
          label: 'invalid driverId',
          payload: {
            driverId: -1,
            vehicleId: 1,
            tariffId: 1,
            status: 'ACTIVE',
            startTime: new Date(),
            startLocation: { lat: 1, lon: 2 },
          },
        },
        {
          label: 'invalid status',
          payload: {
            driverId: 5,
            vehicleId: 1,
            tariffId: 1,
            status: 'WRONG',
            startTime: new Date(),
            startLocation: { lat: 1, lon: 2 },
          },
        },
      ])('rejects for $label', async ({ payload }) => {
        // act + assert
        await expect(service.startTrip(payload as never)).rejects.toThrow();
        expect(tripRepository.create).not.toHaveBeenCalled();
        expect(eventEmitter.emit).not.toHaveBeenCalled();
      });

      it('throws when vehicle not found', async () => {
        // arrange
        vehicleRepository.findById.mockResolvedValue(null);

        // act + assert
        await expect(
          service.startTrip({
            driverId: 1,
            vehicleId: 2,
            tariffId: 1,
            status: 'ACTIVE',
            startTime: new Date(),
            startLocation: { lat: 1, lon: 2 },
          }),
        ).rejects.toThrow('Vehicle not found');
        expect(tripRepository.create).not.toHaveBeenCalled();
        expect(eventEmitter.emit).not.toHaveBeenCalled();
      });

      it('throws when vehicle is already in use', async () => {
        // arrange
        vehicleRepository.findById.mockResolvedValue({
          id: 2,
          status: 'IN_USE',
        } as never);

        // act + assert
        await expect(
          service.startTrip({
            driverId: 1,
            vehicleId: 2,
            tariffId: 1,
            status: 'ACTIVE',
            startTime: new Date(),
            startLocation: { lat: 1, lon: 2 },
          }),
        ).rejects.toThrow('Vehicle is not available');
        expect(tripRepository.create).not.toHaveBeenCalled();
      });

      it('throws when driver already has active trip', async () => {
        // arrange
        vehicleRepository.findById.mockResolvedValue({
          id: 2,
          status: 'ACTIVE',
        } as never);
        tripRepository.findByDriverId.mockResolvedValue([
          { id: 1, status: 'ACTIVE' } as never,
        ]);
        tripRepository.findActiveByVehicleId.mockResolvedValue(null);

        // act + assert
        await expect(
          service.startTrip({
            driverId: 1,
            vehicleId: 2,
            tariffId: 1,
            status: 'ACTIVE',
            startTime: new Date(),
            startLocation: { lat: 1, lon: 2 },
          }),
        ).rejects.toThrow('Driver already has active trip');
        expect(tripRepository.create).not.toHaveBeenCalled();
      });

      it('throws when vehicle already has active trip', async () => {
        vehicleRepository.findById.mockResolvedValue({
          id: 2,
          status: 'ACTIVE',
        } as never);
        tripRepository.findByDriverId.mockResolvedValue([]);
        tripRepository.findActiveByVehicleId.mockResolvedValue({
          id: 99,
          status: 'ACTIVE',
        } as never);

        await expect(
          service.startTrip({
            driverId: 1,
            vehicleId: 2,
            tariffId: 1,
            status: 'ACTIVE',
            startTime: new Date(),
            startLocation: { lat: 1, lon: 2 },
          }),
        ).rejects.toThrow('Vehicle already has active trip');
      });
    });
  });

  describe('finishTrip', () => {
    it('finishes active trip and emits event', async () => {
      // arrange
      tripRepository.findById.mockResolvedValue({
        id: 7,
        driverId: 5,
        vehicleId: 10,
        status: 'ACTIVE',
        endTime: null,
      } as never);
      tripRepository.update.mockResolvedValue({
        id: 7,
        driverId: 5,
        vehicleId: 10,
        status: 'FINISHED',
        endTime: new Date(),
      } as never);

      // act
      await service.finishTrip(7, {});

      // assert
      expect(tripRepository.update).toHaveBeenCalled();
      expect(vehicleRepository.update).toHaveBeenCalledWith(10, {
        status: 'ACTIVE',
      });
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'trip.finished',
        expect.objectContaining({ tripId: 7, driverId: 5 }),
      );
    });

    it('throws for non-active trip', async () => {
      // arrange
      tripRepository.findById.mockResolvedValue({
        id: 7,
        status: 'FINISHED',
      } as never);

      // act + assert
      await expect(service.finishTrip(7, {})).rejects.toThrow(
        'Only active trip can be finished',
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('cancelTrip', () => {
    it('cancels active trip', async () => {
      // arrange
      tripRepository.findById.mockResolvedValue({
        id: 9,
        vehicleId: 3,
        status: 'ACTIVE',
      } as never);
      tripRepository.update.mockResolvedValue({
        id: 9,
        vehicleId: 3,
        status: 'CANCELLED',
      } as never);

      // act
      await service.cancelTrip(9, {});

      // assert
      expect(tripRepository.update).toHaveBeenCalledWith(9, {
        status: 'CANCELLED',
      });
      expect(vehicleRepository.update).toHaveBeenCalledWith(3, {
        status: 'ACTIVE',
      });
    });

    it('throws when trip already finished', async () => {
      // arrange
      tripRepository.findById.mockResolvedValue({
        id: 9,
        status: 'FINISHED',
      } as never);

      // act + assert
      await expect(service.cancelTrip(9, {})).rejects.toThrow(
        'Only active trip can be cancelled',
      );
    });
  });
});
