import { hasBlockingOpenViolations } from './car-availability.evaluator';
import { CarReactivationBlockedException } from './errors';
import { CarStatus } from '../entities/car-status';
import type { ITripRepository } from '../../trip/repositories/trip.repository.interface';
import { TripStatus } from '../../trip/entities/trip.status';
import type { IViolationRepository } from '../../violation/repositories/violation.repository.interface';
import { ViolationStatus } from '../../violation/entities/violation.status';

type Deps = {
  trips: ITripRepository;
  violations: IViolationRepository;
};

/** Проверяет, можно ли вручную вернуть авто в AVAILABLE / isAvailable. */
export async function assertCarReactivationAllowed(
  carId: string,
  patch: { carStatus?: CarStatus; isAvailable?: boolean },
  deps: Deps,
): Promise<void> {
  const wantsAvailable =
    patch.carStatus === CarStatus.AVAILABLE || patch.isAvailable === true;
  if (!wantsAvailable) {
    return;
  }

  const finishedTrips = await deps.trips.findMany({
    carId,
    status: TripStatus.FINISHED,
  });
  const latestFinished = finishedTrips[0];
  if (!latestFinished) {
    return;
  }

  const rows = await deps.violations.findAllByTripId(latestFinished.id);
  const types = rows.map((v) => v.type as ViolationStatus);
  if (!hasBlockingOpenViolations(types)) {
    return;
  }

  throw new CarReactivationBlockedException(
    'Нельзя вернуть автомобиль в строй: есть открытые блокирующие нарушения по последней завершённой поездке',
    carId,
  );
}
