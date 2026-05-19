import type { TripRead } from '../entities/dtos/trip.read';
import type { TripPricingRecalcTrigger } from './trip-pricing-jobs';

export type TripPricingRecalcOptions = {
  trigger: TripPricingRecalcTrigger;
  publishMetrics?: boolean;
};

export interface ITripPricingService {
  recalcAndPersist(
    tripId: string,
    options: TripPricingRecalcOptions,
  ): Promise<TripRead | null>;

  enqueueRecalc(tripId: string, trigger: TripPricingRecalcTrigger): void;
}

export const ITripPricingServiceToken = Symbol('ITripPricingService');
