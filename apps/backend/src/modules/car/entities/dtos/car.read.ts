import { CarStatus } from '../car-status';

export class CarRead {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  color: string;
  mileage: number;
  fuelLevel: number;
  isAvailable: boolean;
  carStatus: CarStatus;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  lastKnownLat: number | null;
  lastKnownLon: number | null;
  lastPositionAt: Date | null;
}
