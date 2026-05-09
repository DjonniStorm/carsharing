import type { CarStatus } from "@/entities/car/model/car-status";

/** Тело `POST /cars` / частичное `PATCH /cars/:id` (как на бэкенде `Car`). */
export type CarCreateBody = {
  brand: string;
  model: string;
  licensePlate: string;
  color: string;
  mileage: number;
  fuelLevel: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt?: string | null;
  carStatus: CarStatus;
  isDeleted: boolean;
  lastKnownLat?: number | null;
  lastKnownLon?: number | null;
  lastPositionAt?: string | null;
};

export type CarUpdateBody = Partial<CarCreateBody>;
