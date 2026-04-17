import {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleEntity,
} from '../../../shared/types/repository.types';

export interface VehicleRepository {
  findById(id: number): Promise<VehicleEntity | null>;
  findAll(): Promise<VehicleEntity[]>;
  findNearby(lat: number, lon: number): Promise<VehicleEntity[]>;
  create(data: CreateVehicleInput): Promise<VehicleEntity>;
  update(id: number, data: UpdateVehicleInput): Promise<VehicleEntity>;
  softDelete(id: number): Promise<VehicleEntity>;
  restore(id: number): Promise<VehicleEntity>;
}
