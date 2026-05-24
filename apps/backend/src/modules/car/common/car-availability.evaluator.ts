import { CarStatus } from '../entities/car-status';
import { ViolationStatus } from '../../violation/entities/violation.status';

export type CarAvailabilityDecision = {
  carStatus: CarStatus;
  isAvailable: boolean;
};

function isOpenViolationType(type: ViolationStatus): boolean {
  return type !== ViolationStatus.RESOLVED && type !== ViolationStatus.IGNORED;
}

/** Открытое нарушение, блокирующее ручной возврат авто в строй. */
export function isBlockingOpenViolation(type: ViolationStatus): boolean {
  if (!isOpenViolationType(type)) {
    return false;
  }
  return (
    type === ViolationStatus.WRONG_PARKING ||
    type === ViolationStatus.OUT_OF_GEOZONE ||
    type === ViolationStatus.LOW_FUEL
  );
}

export function hasBlockingOpenViolations(
  violationTypes: ViolationStatus[],
): boolean {
  return violationTypes.some(isBlockingOpenViolation);
}

/**
 * Определяет операционный статус авто по открытым нарушениям поездки (после finish).
 */
export function evaluateCarAvailability(
  violationTypes: ViolationStatus[],
): CarAvailabilityDecision {
  const open = violationTypes.filter(isOpenViolationType);

  if (
    open.some(
      (t) =>
        t === ViolationStatus.WRONG_PARKING ||
        t === ViolationStatus.OUT_OF_GEOZONE,
    )
  ) {
    return {
      carStatus: CarStatus.OUT_OF_SERVICE,
      isAvailable: false,
    };
  }

  if (open.includes(ViolationStatus.LOW_FUEL)) {
    return {
      carStatus: CarStatus.UNAVAILABLE,
      isAvailable: false,
    };
  }

  if (open.includes(ViolationStatus.SPEEDING)) {
    return {
      carStatus: CarStatus.UNAVAILABLE,
      isAvailable: true,
    };
  }

  return {
    carStatus: CarStatus.AVAILABLE,
    isAvailable: true,
  };
}
