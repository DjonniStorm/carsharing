import { ViolationStatus } from "@/entities/violation";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

/** Все значения для фильтров и отображения. */
export const VIOLATION_STATUSES_ORDERED: ViolationStatus[] = [
  ViolationStatus.SPEEDING,
  ViolationStatus.OUT_OF_GEOZONE,
  ViolationStatus.WRONG_PARKING,
  ViolationStatus.LOW_FUEL,
  ViolationStatus.RESOLVED,
  ViolationStatus.IGNORED,
  ViolationStatus.UNKNOWN,
];

/** Типы для ручного создания нарушения (без служебных «закрытых» статусов). */
export const VIOLATION_CREATABLE_STATUSES_ORDERED: ViolationStatus[] = [
  ViolationStatus.SPEEDING,
  ViolationStatus.OUT_OF_GEOZONE,
  ViolationStatus.WRONG_PARKING,
  ViolationStatus.LOW_FUEL,
  ViolationStatus.UNKNOWN,
];

export function violationStatusLangKey(status: ViolationStatus): LangKey {
  switch (status) {
    case ViolationStatus.SPEEDING:
      return LANG_KEYS.pages.violationsKindSpeeding;
    case ViolationStatus.OUT_OF_GEOZONE:
      return LANG_KEYS.pages.violationsKindOutOfGeozone;
    case ViolationStatus.WRONG_PARKING:
      return LANG_KEYS.pages.violationsKindWrongParking;
    case ViolationStatus.LOW_FUEL:
      return LANG_KEYS.pages.violationsKindLowFuel;
    case ViolationStatus.RESOLVED:
      return LANG_KEYS.pages.violationsKindResolved;
    case ViolationStatus.IGNORED:
      return LANG_KEYS.pages.violationsKindIgnored;
    case ViolationStatus.UNKNOWN:
      return LANG_KEYS.pages.violationsKindUnknown;
    default:
      return LANG_KEYS.pages.violationsKindUnknown;
  }
}

export function isViolationTerminal(status: ViolationStatus): boolean {
  return (
    status === ViolationStatus.RESOLVED || status === ViolationStatus.IGNORED
  );
}
