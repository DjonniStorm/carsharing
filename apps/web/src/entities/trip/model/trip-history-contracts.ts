import type { CarRead } from "@/entities/car";
import type { ViolationRead } from "@/entities/violation";

import type { TripRead } from "@/entities/trip/model/trip-contracts";

/** Ответ `GET /trip-history/:tripId` (без телеметрии). */
export type TripHistoryShortInfoRead = {
  trip: TripRead;
  car: CarRead;
  violations: ViolationRead[];
};

/** Точка телеметрии в ответе `GET /trip-history/:tripId/full`. */
export type TelemetryPointRead = {
  id: string;
  tripId: string;
  timestamp: string;
  lat: number;
  lon: number;
  speed: number;
  acceleration: number;
  fuelLevel: number;
};

/** Ответ `GET /trip-history/:tripId/full`. */
export type TripHistoryFullRead = TripHistoryShortInfoRead & {
  points: TelemetryPointRead[];
};
