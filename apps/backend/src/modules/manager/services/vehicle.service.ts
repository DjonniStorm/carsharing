import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { VehicleRepository } from '../repositories/vehicle.repository';
import { REPOSITORY_TOKENS } from '../../../shared/tokens/repository.tokens';
import {
  DOMAIN_EVENTS,
  VehicleUpdatedEvent,
} from '../../../shared/events/domain.events';
import { CreateVehicleInput, UpdateVehicleInput } from '../../../shared/types/repository.types';

@Injectable()
export class VehicleService {
  constructor(
    @Inject(REPOSITORY_TOKENS.vehicle)
    private readonly vehicleRepository: VehicleRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createVehicle(data: CreateVehicleInput) {
    this.assertCreateVehicleInput(data);
    return this.vehicleRepository.create(data);
  }

  async updateVehicle(id: number, data: UpdateVehicleInput) {
    this.assertPositiveId(id, 'vehicleId');
    return this.vehicleRepository.update(id, data);
  }

  async softDeleteVehicle(id: number) {
    this.assertPositiveId(id, 'vehicleId');
    const current = await this.vehicleRepository.findById(id);
    if (!current) {
      throw new Error('Vehicle not found');
    }
    return this.vehicleRepository.softDelete(id);
  }

  async restoreVehicle(id: number) {
    this.assertPositiveId(id, 'vehicleId');
    const current = await this.vehicleRepository.findById(id);
    if (!current) {
      throw new Error('Vehicle not found');
    }
    if (current.deletedAt === null) {
      return current;
    }
    return this.vehicleRepository.restore(id);
  }

  async getVehicles() {
    return this.vehicleRepository.findAll();
  }

  async getNearbyVehicles(lat: number, lon: number) {
    this.assertFiniteNumber(lat, 'lat');
    this.assertFiniteNumber(lon, 'lon');
    return this.vehicleRepository.findNearby(lat, lon);
  }

  async updatePosition(vehicleId: number, lat: number, lon: number) {
    this.assertPositiveId(vehicleId, 'vehicleId');
    this.assertFiniteNumber(lat, 'lat');
    this.assertFiniteNumber(lon, 'lon');
    const updatedVehicle = await this.vehicleRepository.findById(vehicleId);
    if (!updatedVehicle) {
      throw new Error('Vehicle not found');
    }
    const payload: VehicleUpdatedEvent = { vehicleId, lat, lon };
    this.eventEmitter.emit(DOMAIN_EVENTS.vehicleUpdated, payload);
    return updatedVehicle;
  }

  private assertCreateVehicleInput(data: CreateVehicleInput): void {
    const validStatuses = ['ACTIVE', 'IN_USE', 'BLOCKED'];
    if (!data || typeof data !== 'object') {
      throw new Error('Vehicle payload must be an object');
    }
    if (typeof data.brand !== 'string' || data.brand.trim().length === 0) {
      throw new Error('Invalid brand');
    }
    if (typeof data.model !== 'string' || data.model.trim().length === 0) {
      throw new Error('Invalid model');
    }
    if (typeof data.plateNumber !== 'string' || data.plateNumber.trim().length === 0) {
      throw new Error('Invalid plateNumber');
    }
    if (!validStatuses.includes(data.status)) {
      throw new Error('Invalid status');
    }
    if (!data.location || typeof data.location !== 'object') {
      throw new Error('Invalid location');
    }
    this.assertFiniteNumber(data.location.lat, 'location.lat');
    this.assertFiniteNumber(data.location.lon, 'location.lon');
  }

  private assertPositiveId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Invalid ${field}`);
    }
  }

  private assertFiniteNumber(value: number, field: string): void {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid ${field}`);
    }
  }
}
