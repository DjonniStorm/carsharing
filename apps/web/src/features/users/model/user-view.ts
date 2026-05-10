import { action, atom, wrap } from "@reatom/core";

import type { ReadUser } from "@/entities/user";
import { UserRole } from "@/entities/user";
import type { ViolationRead } from "@/entities/violation";
import { usersApi } from "@/features/auth/api";
import { tripHistoryApi } from "@/features/trips/api";
import { violationsFromTripHistoryRows } from "@/features/trips/lib/violations-from-trip-history";
import type { AsyncStatus } from "@/shared/model/async-status";

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

/** Карточка пользователя и при необходимости нарушения водителя (из истории поездок). */
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

    if (user.role !== UserRole.DRIVER) {
      userViewViolationsAtom.set([]);
      userViewViolationsStatusAtom.set("idle");
      return;
    }

    userViewViolationsStatusAtom.set("loading");
    try {
      const rows = await wrap(
        tripHistoryApi.listShort({
          userId: user.id,
          limit: DRIVER_HISTORY_LIMIT,
        }),
      );
      userViewViolationsAtom.set(violationsFromTripHistoryRows(rows));
      userViewViolationsStatusAtom.set("idle");
    } catch (e) {
      userViewViolationsAtom.set([]);
      userViewViolationsStatusAtom.set("error");
      userViewViolationsErrorAtom.set(
        e instanceof Error ? e.message : String(e),
      );
    }
  } catch (e) {
    userViewProfileAtom.set(null);
    userViewProfileStatusAtom.set("error");
    userViewProfileErrorAtom.set(
      e instanceof Error ? e.message : String(e),
    );
    userViewViolationsAtom.set([]);
    userViewViolationsStatusAtom.set("idle");
  }
}, "loadUserViewPage");
