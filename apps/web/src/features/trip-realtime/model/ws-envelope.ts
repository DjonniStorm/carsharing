import type { TripStatus } from "@/entities/trip";

export type TripMetricsUpdatedPayload = {
  tripId: string;
  carId: string;
  distanceMeters: number | null;
  chargedMinutes: number | null;
  chargedKm: number | null;
  priceTime: number | null;
  priceDistance: number | null;
  pricePause: number | null;
  priceTotal: number | null;
  ts: string;
};

export type TripStateChangedPayload = {
  tripId: string;
  carId: string;
  status: TripStatus;
  previousStatus?: TripStatus;
  ts: string;
};

export type TripFinishedPayload = {
  tripId: string;
  carId: string;
  finishedAt: string;
  distanceMeters: number | null;
  chargedMinutes: number | null;
  chargedKm: number | null;
  priceTotal: number | null;
  ts: string;
};
