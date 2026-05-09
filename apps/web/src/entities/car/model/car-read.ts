import type { CarStatus } from "@/entities/car/model/car-status";

/** Ответ `GET /cars` — даты приходят ISO-строками из JSON. */
export type CarRead = {
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
  createdAt: string;
  updatedAt: string | null;
  lastKnownLat: number | null;
  lastKnownLon: number | null;
  lastPositionAt: string | null;
};
