import { TripStatus } from '../entities/trip.status';

export type TripPricingRates = {
  pricePerMinute: number;
  pricePerKm: number;
  pausePricePerMinute: number;
};

export type TripPricingTripSnapshot = {
  status: TripStatus;
  startedAt: Date;
  finishedAt: Date | null;
  pauseStartedAt: Date | null;
  totalPausedSec: number;
};

export type TripPricingTelemetryPoint = {
  lat: number;
  lon: number;
};

export type TripPricingInput = {
  trip: TripPricingTripSnapshot;
  rates: TripPricingRates;
  telemetryPoints: TripPricingTelemetryPoint[];
  asOf: Date;
};

export type TripPricingResult = {
  distanceMeters: number;
  chargedMinutes: number;
  chargedKm: number;
  priceTime: number;
  priceDistance: number;
  pricePause: number;
  priceTotal: number;
  distance: number;
  duration: number;
};
