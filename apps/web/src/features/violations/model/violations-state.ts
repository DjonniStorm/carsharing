import { action, atom, wrap } from "@reatom/core";

import type { ViolationRead } from "@/entities/violation";
import { violationsApi } from "@/features/violations/api";

import type { AsyncStatus } from "@/shared/model/async-status";

export const violationsAdminListAtom = atom<ViolationRead[] | null>(
  null,
  "violationsAdminList",
);

export const violationsAdminListStatusAtom = atom<AsyncStatus>(
  "idle",
  "violationsAdminListStatus",
);

export const violationsAdminListErrorAtom = atom<string | null>(
  null,
  "violationsAdminListError",
);

export const resetViolationsAdminListState = action(() => {
  violationsAdminListAtom.set(null);
  violationsAdminListStatusAtom.set("idle");
  violationsAdminListErrorAtom.set(null);
}, "resetViolationsAdminListState");

export const loadViolationsAdminList = action(
  async (params?: { includeResolved?: boolean }) => {
    violationsAdminListStatusAtom.set("loading");
    violationsAdminListErrorAtom.set(null);
    try {
      const list = await wrap(
        violationsApi.findAll({
          includeResolved: params?.includeResolved,
        }),
      );
      violationsAdminListAtom.set(list);
      violationsAdminListStatusAtom.set("idle");
    } catch (e) {
      violationsAdminListStatusAtom.set("error");
      violationsAdminListErrorAtom.set(
        e instanceof Error ? e.message : String(e),
      );
    }
  },
  "loadViolationsAdminList",
);
