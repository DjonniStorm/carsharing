import type { CarRead } from "@/entities/car";
import { CarStatus } from "@/entities/car";
import { ViolationStatus } from "@/entities/violation";

const MANAGER_COMMENT_MIN_LEN = 20;

export function isCarEligibleForReturnWizard(car: CarRead): boolean {
  return (
    !car.isAvailable &&
    (car.carStatus === CarStatus.OUT_OF_SERVICE ||
      car.carStatus === CarStatus.UNAVAILABLE)
  );
}

export function isBlockingOpenViolation(type: ViolationStatus): boolean {
  if (type === ViolationStatus.RESOLVED || type === ViolationStatus.IGNORED) {
    return false;
  }
  return (
    type === ViolationStatus.WRONG_PARKING ||
    type === ViolationStatus.OUT_OF_GEOZONE ||
    type === ViolationStatus.LOW_FUEL
  );
}

export function isManagerCommentValid(comment: string): boolean {
  return comment.trim().length >= MANAGER_COMMENT_MIN_LEN;
}

export { MANAGER_COMMENT_MIN_LEN };
