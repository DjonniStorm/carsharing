import { TripStatus } from '../../entities/trip.status';
import type { TripPricingRecalcJob } from '../trip-pricing-jobs';
import type { ITripPricingService } from '../trip-pricing.service.interface';

export type TripPricingRecalcHandlerDeps = {
  pricingService: ITripPricingService;
};

export async function executeTripPricingRecalc(
  input: TripPricingRecalcJob,
  deps: TripPricingRecalcHandlerDeps,
): Promise<void> {
  await deps.pricingService.recalcAndPersist(input.tripId, {
    trigger: input.trigger,
    publishMetrics: true,
  });
}

/** Не пересчитывать завершённые/отменённые поездки по телеметрии (опоздавший job). */
export function shouldSkipTelemetryRecalc(
  status: TripStatus,
  trigger: TripPricingRecalcJob['trigger'],
): boolean {
  if (trigger !== 'telemetry') {
    return false;
  }
  return status === TripStatus.FINISHED || status === TripStatus.CANCELLED;
}
