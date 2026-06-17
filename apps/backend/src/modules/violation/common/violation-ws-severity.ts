import type { ViolationCreatedPayload } from '../../trip/realtime/trip-events.payloads';
import { ViolationStatus } from '../entities/violation.status';

/**
 * Грубая шкала серьёзности для live-панели (до появления отдельного поля в БД).
 *
 * Пример: SPEEDING / OUT_OF_GEOZONE => high, WRONG_PARKING => medium, LOW_FUEL => low.
 */
export function violationSeverityForWs(
  type: ViolationStatus,
): ViolationCreatedPayload['severity'] {
  switch (type) {
    case ViolationStatus.SPEEDING:
    case ViolationStatus.OUT_OF_GEOZONE:
      return 'high';
    case ViolationStatus.WRONG_PARKING:
      return 'medium';
    case ViolationStatus.LOW_FUEL:
      return 'low';
    case ViolationStatus.RESOLVED:
    case ViolationStatus.IGNORED:
      return 'low';
    default:
      return 'medium';
  }
}
