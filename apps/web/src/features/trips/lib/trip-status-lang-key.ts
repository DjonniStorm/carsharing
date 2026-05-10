import { TripStatus } from "@/entities/trip";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

export function tripStatusLangKey(status: TripStatus): LangKey {
  switch (status) {
    case TripStatus.PENDING:
      return LANG_KEYS.pages.tripStatusPending;
    case TripStatus.STARTED:
      return LANG_KEYS.pages.tripStatusStarted;
    case TripStatus.ACTIVE:
      return LANG_KEYS.pages.tripStatusActive;
    case TripStatus.PAUSED:
      return LANG_KEYS.pages.tripStatusPaused;
    case TripStatus.FINISHED:
      return LANG_KEYS.pages.tripStatusFinished;
    case TripStatus.CANCELLED:
      return LANG_KEYS.pages.tripStatusCancelled;
    case TripStatus.ERROR:
      return LANG_KEYS.pages.tripStatusError;
    default:
      return LANG_KEYS.pages.tripStatusUnknown;
  }
}
