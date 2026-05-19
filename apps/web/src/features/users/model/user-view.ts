import { action, atom, wrap } from "@reatom/core";

import type { ReadUser } from "@/entities/user";
import type { ViolationRead } from "@/entities/violation";
import { usersApi } from "@/features/auth/api";
import { tripHistoryApi } from "@/features/trips/api";
import { violationsFromTripHistoryRows } from "@/features/trips/lib/violations-from-trip-history";
import { resolveApiErrorMessage } from "@/shared/api";
import { LANG_KEYS } from "@/shared/i18n/keys";
import type { AsyncStatus } from "@/shared/model/async-status";
import { notifyApiError } from "@/shared/lib/notify-api-error";

const DRIVER_HISTORY_LIMIT = 500;

export const userViewProfileAtom = atom<ReadUser | null>(
  null,
  "userViewProfile",
);

export const userViewProfileStatusAtom = atom<AsyncStatus>(
  "idle",
  "userViewProfileStatus",
);

export const userViewProfileErrorAtom = atom<string | null>(
  null,
  "userViewProfileError",
);

export const userViewViolationsAtom = atom<ViolationRead[]>(
  [],
  "userViewViolations",
);

export const userViewViolationsStatusAtom = atom<AsyncStatus>(
  "idle",
  "userViewViolationsStatus",
);

export const userViewViolationsErrorAtom = atom<string | null>(
  null,
  "userViewViolationsError",
);

export const resetUserView = action(() => {
  userViewProfileAtom.set(null);
  userViewProfileStatusAtom.set("idle");
  userViewProfileErrorAtom.set(null);
  userViewViolationsAtom.set([]);
  userViewViolationsStatusAtom.set("idle");
  userViewViolationsErrorAtom.set(null);
}, "resetUserView");

/** Карточка пользователя и нарушения из истории поездок этого пользователя (`GET /trip-history`). */
export const loadUserViewPage = action(async (userId: string) => {
  userViewProfileStatusAtom.set("loading");
  userViewProfileErrorAtom.set(null);
  userViewViolationsAtom.set([]);
  userViewViolationsErrorAtom.set(null);
  userViewViolationsStatusAtom.set("idle");

  try {
    const user = await wrap(usersApi.findById(userId));
    userViewProfileAtom.set(user);
    userViewProfileStatusAtom.set("idle");

    userViewViolationsStatusAtom.set("loading");
    try {
      const rows = await wrap(
        tripHistoryApi.listShort({
          userId,
          limit: DRIVER_HISTORY_LIMIT,
        }),
      );
      userViewViolationsAtom.set(violationsFromTripHistoryRows(rows));
      userViewViolationsStatusAtom.set("idle");
    } catch (e) {
      userViewViolationsAtom.set([]);
      userViewViolationsStatusAtom.set("error");
      userViewViolationsErrorAtom.set(resolveApiErrorMessage(e));

      notifyApiError(LANG_KEYS.errors.loadFailed, e);
    }
  } catch (e) {
    userViewProfileAtom.set(null);
    userViewProfileStatusAtom.set("error");
    userViewProfileErrorAtom.set(resolveApiErrorMessage(e));
    userViewViolationsAtom.set([]);
    userViewViolationsStatusAtom.set("idle");
  }
}, "loadUserViewPage");
