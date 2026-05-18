import { pathDistanceMeters } from 'src/shared/geo/haversine';

import { TripStatus } from '../entities/trip.status';
import type {
  TripPricingInput,
  TripPricingResult,
} from './trip-pricing.types';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function computePauseSec(
  trip: TripPricingInput['trip'],
  endAt: Date,
): number {
  let pauseSec = Math.max(0, trip.totalPausedSec);
  if (
    trip.status === TripStatus.PAUSED &&
    trip.pauseStartedAt != null &&
    trip.pauseStartedAt.getTime() <= endAt.getTime()
  ) {
    pauseSec += Math.max(
      0,
      Math.floor((endAt.getTime() - trip.pauseStartedAt.getTime()) / 1000),
    );
  }
  return pauseSec;
}

/**
 * Чистый расчёт метрик и стоимости поездки (ставки из snapshot версии геозоны).
 */
export function calculateTripPricing(
  input: TripPricingInput,
): TripPricingResult {
  const { trip, rates, telemetryPoints, asOf } = input;
  const endAt = trip.finishedAt ?? asOf;
  const elapsedSec = Math.max(
    0,
    Math.floor((endAt.getTime() - trip.startedAt.getTime()) / 1000),
  );
  const pauseSec = computePauseSec(trip, endAt);
  const drivingSec = Math.max(0, elapsedSec - pauseSec);

  const chargedMinutes = round2(drivingSec / 60);
  const pauseMinutes = round2(pauseSec / 60);

  const rawDistanceMeters = pathDistanceMeters(telemetryPoints);
  const distanceMeters = Math.round(rawDistanceMeters);
  const chargedKm = round3(distanceMeters / 1000);

  const priceTime = roundMoney(chargedMinutes * rates.pricePerMinute);
  const priceDistance = roundMoney(chargedKm * rates.pricePerKm);
  const pricePause = roundMoney(pauseMinutes * rates.pausePricePerMinute);
  const priceTotal = roundMoney(priceTime + priceDistance + pricePause);

  const duration = drivingSec / 3600;
  const distance = chargedKm;

  return {
    distanceMeters,
    chargedMinutes,
    chargedKm,
    priceTime,
    priceDistance,
    pricePause,
    priceTotal,
    distance,
    duration,
  };
}
