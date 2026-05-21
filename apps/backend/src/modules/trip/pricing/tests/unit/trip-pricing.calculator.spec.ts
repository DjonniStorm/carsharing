import { describe, expect, it } from 'vitest';

import { TripStatus } from '../../../entities/trip.status';
import { calculateTripPricing } from '../../trip-pricing.calculator';
import type { TripPricingInput } from '../../trip-pricing.types';

const rates = {
  pricePerMinute: 2,
  pricePerKm: 10,
  pausePricePerMinute: 1,
};

function baseInput(
  overrides: Partial<Omit<TripPricingInput, 'trip'>> & {
    trip?: Partial<TripPricingInput['trip']>;
  } = {},
): TripPricingInput {
  const startedAt = new Date('2026-05-18T10:00:00.000Z');
  const { trip: tripOverrides, ...rest } = overrides;
  return {
    rates,
    telemetryPoints: [],
    asOf: new Date('2026-05-18T10:10:00.000Z'),
    ...rest,
    trip: {
      status: TripStatus.ACTIVE,
      startedAt,
      finishedAt: null,
      pauseStartedAt: null,
      totalPausedSec: 0,
      ...tripOverrides,
    },
  };
}

describe('calculateTripPricing', () => {
  it('charges driving time only (10 min at 2/min)', () => {
    const result = calculateTripPricing(baseInput());
    expect(result.chargedMinutes).toBe(10);
    expect(result.priceTime).toBe(20);
    expect(result.pricePause).toBe(0);
    expect(result.priceDistance).toBe(0);
    expect(result.priceTotal).toBe(20);
    expect(result.distanceMeters).toBe(0);
  });

  it('includes accumulated and active pause minutes', () => {
    const startedAt = new Date('2026-05-18T10:00:00.000Z');
    const pauseStartedAt = new Date('2026-05-18T10:05:00.000Z');
    const asOf = new Date('2026-05-18T10:15:00.000Z');
    const result = calculateTripPricing(
      baseInput({
        asOf,
        trip: {
          status: TripStatus.PAUSED,
          startedAt,
          finishedAt: null,
          pauseStartedAt,
          totalPausedSec: 120,
        },
      }),
    );
    // elapsed 15m, pause 2m stored + 10m active = 12m pause => 3m driving
    expect(result.chargedMinutes).toBe(3);
    expect(result.pricePause).toBe(12);
    expect(result.priceTime).toBe(6);
    expect(result.priceTotal).toBe(18);
  });

  it('sums haversine distance across telemetry points', () => {
    const result = calculateTripPricing(
      baseInput({
        telemetryPoints: [
          { lat: 55.75, lon: 37.61 },
          { lat: 55.751, lon: 37.611 },
          { lat: 55.752, lon: 37.612 },
        ],
      }),
    );
    expect(result.distanceMeters).toBeGreaterThan(0);
    expect(result.chargedKm).toBeGreaterThan(0);
    expect(result.priceDistance).toBeGreaterThan(0);
  });

  it('uses finishedAt instead of asOf when trip is finished', () => {
    const startedAt = new Date('2026-05-18T10:00:00.000Z');
    const finishedAt = new Date('2026-05-18T10:05:00.000Z');
    const result = calculateTripPricing(
      baseInput({
        asOf: new Date('2026-05-18T11:00:00.000Z'),
        trip: {
          status: TripStatus.FINISHED,
          startedAt,
          finishedAt,
          pauseStartedAt: null,
          totalPausedSec: 0,
        },
      }),
    );
    expect(result.chargedMinutes).toBe(5);
    expect(result.priceTime).toBe(10);
  });

  it('rounds money to 2 decimal places', () => {
    const result = calculateTripPricing(
      baseInput({
        rates: {
          pricePerMinute: 1.115,
          pricePerKm: 0,
          pausePricePerMinute: 0,
        },
        trip: {
          status: TripStatus.ACTIVE,
          startedAt: new Date('2026-05-18T10:00:00.000Z'),
          finishedAt: null,
          pauseStartedAt: null,
          totalPausedSec: 0,
        },
        asOf: new Date('2026-05-18T10:01:00.000Z'),
      }),
    );
    expect(result.priceTime).toBe(1.12);
  });
});
