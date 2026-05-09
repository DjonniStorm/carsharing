import type { AddCarFormOutput, CarCreateBody } from "@/entities/car";
import { CarStatus } from "@/entities/car";

/** Значения не задаются в UI формы — только при сборке запроса. */
const NEW_CAR_REQUEST_STATUS = CarStatus.CREATED;
const NEW_CAR_REQUEST_AVAILABLE = true;

export function buildCreateCarBodyFromForm(
  values: AddCarFormOutput,
): CarCreateBody {
  return {
    brand: values.brand,
    model: values.model,
    licensePlate: values.licensePlate,
    color: values.color,
    mileage: values.mileage,
    fuelLevel: values.fuelLevel,
    isAvailable: NEW_CAR_REQUEST_AVAILABLE,
    carStatus: NEW_CAR_REQUEST_STATUS,
    createdAt: new Date().toISOString(),
    isDeleted: false,
  };
}
