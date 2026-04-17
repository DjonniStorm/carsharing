import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { TripRepository } from '../repositories/trip.repository';
import type { VehicleRepository } from '../../manager/repositories/vehicle.repository';
import { REPOSITORY_TOKENS } from '../../../shared/tokens/repository.tokens';
import {
  DOMAIN_EVENTS,
  TripFinishedEvent,
  TripStartedEvent,
} from '../../../shared/events/domain.events';
import {
  CreateTripInput,
  UpdateTripInput,
} from '../../../shared/types/repository.types';

@Injectable()
export class TripService {
  constructor(
    @Inject(REPOSITORY_TOKENS.trip)
    private readonly tripRepository: TripRepository,
    @Inject(REPOSITORY_TOKENS.vehicle)
    private readonly vehicleRepository: VehicleRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async startTrip(data: CreateTripInput) {
    this.assertCreateTripInput(data);
    const vehicle = await this.vehicleRepository.findById(data.vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    if (vehicle.status !== 'ACTIVE') {
      throw new Error('Vehicle is not available');
    }
    const driverTrips = await this.tripRepository.findByDriverId(data.driverId);
    if (driverTrips.some((trip) => trip.status === 'ACTIVE')) {
      throw new Error('Driver already has active trip');
    }

    const trip = await this.tripRepository.create(data);
    const payload: TripStartedEvent = {
      tripId: trip.id,
      driverId: trip.driverId,
      vehicleId: trip.vehicleId,
      startedAt: trip.startTime,
    };
    this.eventEmitter.emit(DOMAIN_EVENTS.tripStarted, payload);
    return trip;
  }

  async finishTrip(id: number, data: UpdateTripInput) {
    this.assertPositiveId(id, 'tripId');
    const existing = await this.tripRepository.findById(id);
    if (!existing) {
      throw new Error('Trip not found');
    }
    if (existing.status !== 'ACTIVE') {
      throw new Error('Only active trip can be finished');
    }
    const updateData: UpdateTripInput = {
      ...data,
      status: 'FINISHED',
      endTime: data.endTime ?? new Date(),
    };
    const trip = await this.tripRepository.update(id, updateData);
    const payload: TripFinishedEvent = {
      tripId: trip.id,
      driverId: trip.driverId,
      finishedAt: trip.endTime ?? new Date(),
    };
    this.eventEmitter.emit(DOMAIN_EVENTS.tripFinished, payload);
    return trip;
  }

  async cancelTrip(id: number, data: UpdateTripInput) {
    this.assertPositiveId(id, 'tripId');
    const existing = await this.tripRepository.findById(id);
    if (!existing) {
      throw new Error('Trip not found');
    }
    if (existing.status !== 'ACTIVE') {
      throw new Error('Only active trip can be cancelled');
    }
    return this.tripRepository.update(id, { ...data, status: 'CANCELLED' });
  }

  async getTrip(id: number) {
    this.assertPositiveId(id, 'tripId');
    return this.tripRepository.findById(id);
  }

  async getDriverTrips(driverId: number) {
    this.assertPositiveId(driverId, 'driverId');
    return this.tripRepository.findByDriverId(driverId);
  }

  private assertCreateTripInput(data: CreateTripInput): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Trip payload must be an object');
    }
    this.assertPositiveId(data.driverId, 'driverId');
    this.assertPositiveId(data.vehicleId, 'vehicleId');
    if (
      !(data.startTime instanceof Date) ||
      Number.isNaN(data.startTime.getTime())
    ) {
      throw new Error('Invalid startTime');
    }
    if (!['ACTIVE', 'FINISHED', 'CANCELLED'].includes(data.status)) {
      throw new Error('Invalid status');
    }
  }

  private assertPositiveId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Invalid ${field}`);
    }
  }
}
