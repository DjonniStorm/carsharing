import { action, atom, wrap } from "@reatom/core";

import type { TripNotificationRead } from "@/entities/manager-violation-notice";
import type { ReadUser } from "@/entities/user";
import { usersApi } from "@/features/auth/api";
import { managerViolationNoticeApi } from "@/features/manager-violation-notice/api";
import { resolveApiErrorMessage } from "@/shared/api";
import type { AsyncStatus } from "@/shared/model/async-status";

export const tripViewEmailNoticesAtom = atom<TripNotificationRead[]>(
  [],
  "tripViewEmailNotices",
);

export const tripViewEmailNoticesStatusAtom = atom<AsyncStatus>(
  "idle",
  "tripViewEmailNoticesStatus",
);

export const tripViewEmailNoticesErrorAtom = atom<string | null>(
  null,
  "tripViewEmailNoticesError",
);

export const tripViewUsersByIdAtom = atom<Map<string, ReadUser>>(
  () => new Map(),
  "tripViewUsersById",
);

export const tripViewUsersStatusAtom = atom<AsyncStatus>(
  "idle",
  "tripViewUsersStatus",
);

let tripViewUsersLoadSeq = 0;

export const resetTripViewPageExtras = action(() => {
  tripViewEmailNoticesAtom.set([]);
  tripViewEmailNoticesStatusAtom.set("idle");
  tripViewEmailNoticesErrorAtom.set(null);
  tripViewUsersByIdAtom.set(new Map());
  tripViewUsersStatusAtom.set("idle");
  tripViewUsersLoadSeq += 1;
}, "resetTripViewPageExtras");

export const loadTripViewEmailNotices = action(async (tripId: string) => {
  tripViewEmailNoticesStatusAtom.set("loading");
  tripViewEmailNoticesErrorAtom.set(null);
  try {
    const list = await wrap(
      managerViolationNoticeApi.listTripNotifications(tripId),
    );
    tripViewEmailNoticesAtom.set(list);
    tripViewEmailNoticesStatusAtom.set("idle");
  } catch (e) {
    tripViewEmailNoticesAtom.set([]);
    tripViewEmailNoticesStatusAtom.set("error");
    tripViewEmailNoticesErrorAtom.set(resolveApiErrorMessage(e));
  }
}, "loadTripViewEmailNotices");

export const loadTripViewUsers = action(async (userIds: string[]) => {
  const seq = ++tripViewUsersLoadSeq;
  const unique = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];

  if (unique.length === 0) {
    tripViewUsersByIdAtom.set(new Map());
    tripViewUsersStatusAtom.set("idle");
    return;
  }

  tripViewUsersStatusAtom.set("loading");
  try {
    const rows = await wrap(
      Promise.all(
        unique.map((id) =>
          usersApi
            .findById(id)
            .then((u) => ({ id, u }))
            .catch(() => ({ id, u: undefined as ReadUser | undefined })),
        ),
      ),
    );
    if (seq !== tripViewUsersLoadSeq) {
      return;
    }
    const m = new Map<string, ReadUser>();
    for (const { id, u } of rows) {
      if (u) {
        m.set(id, u);
      }
    }
    tripViewUsersByIdAtom.set(m);
    tripViewUsersStatusAtom.set("idle");
  } catch {
    if (seq !== tripViewUsersLoadSeq) {
      return;
    }
    tripViewUsersByIdAtom.set(new Map());
    tripViewUsersStatusAtom.set("error");
  }
}, "loadTripViewUsers");
