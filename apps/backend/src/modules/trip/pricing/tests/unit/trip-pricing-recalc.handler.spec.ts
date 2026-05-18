import { describe, expect, it, vi } from 'vitest';

import { TripStatus } from '../../../entities/trip.status';
import {
  executeTripPricingRecalc,
  shouldSkipTelemetryRecalc,
} from '../../handlers/trip-pricing-recalc.handler';
import type { ITripPricingService } from '../../trip-pricing.service.interface';

describe('shouldSkipTelemetryRecalc', () => {
  it('skips telemetry for FINISHED and CANCELLED', () => {
    expect(
      shouldSkipTelemetryRecalc(TripStatus.FINISHED, 'telemetry'),
    ).toBe(true);
    expect(
      shouldSkipTelemetryRecalc(TripStatus.CANCELLED, 'telemetry'),
    ).toBe(true);
    expect(shouldSkipTelemetryRecalc(TripStatus.ACTIVE, 'telemetry')).toBe(
      false,
    );
  });

  it('does not skip status/finish triggers', () => {
    expect(
      shouldSkipTelemetryRecalc(TripStatus.FINISHED, 'status'),
    ).toBe(false);
  });
});

describe('executeTripPricingRecalc', () => {
  it('calls recalcAndPersist with publishMetrics', async () => {
    const pricingService: ITripPricingService = {
      recalcAndPersist: vi.fn().mockResolvedValue(null),
      enqueueRecalc: vi.fn(),
    };

    await executeTripPricingRecalc(
      { tripId: 'trip-1', trigger: 'telemetry' },
      { pricingService },
    );

    expect(pricingService.recalcAndPersist).toHaveBeenCalledWith('trip-1', {
      trigger: 'telemetry',
      publishMetrics: true,
    });
  });
});
