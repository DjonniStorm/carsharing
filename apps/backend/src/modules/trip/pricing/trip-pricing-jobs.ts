export const TripPricingJobName = {
  Recalc: 'trip.pricing.recalc',
} as const;

export type TripPricingRecalcTrigger = 'telemetry' | 'status' | 'finish';

export type TripPricingRecalcJob = {
  tripId: string;
  trigger: TripPricingRecalcTrigger;
};
