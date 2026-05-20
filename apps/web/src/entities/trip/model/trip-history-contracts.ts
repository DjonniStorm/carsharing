import type { CarRead } from "@/entities/car";
import type { ViolationRead } from "@/entities/violation";

import type { TripRead } from "@/entities/trip/model/trip-contracts";

export type TripHistoryShortInfoRead = {
  trip: TripRead;
  car: CarRead;
  violations: ViolationRead[];
};

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

export type TripHistoryFullRead = TripHistoryShortInfoRead & {
  points: TelemetryPointRead[];
};
