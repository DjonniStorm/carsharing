import { action, atom, wrap } from "@reatom/core";

import type { ReadUser } from "@/entities/user";
import { usersApi } from "@/features/auth/api";
import { resolveApiErrorMessage } from "@/shared/api";
import type { AsyncStatus } from "@/shared/model/async-status";

export const usersListAtom = atom<ReadUser[] | null>(null, "usersList");

export const usersListStatusAtom = atom<AsyncStatus>("idle", "usersListStatus");

export const usersListErrorAtom = atom<string | null>(null, "usersListError");

export const resetUsersListState = action(() => {
  usersListAtom.set(null);
  usersListStatusAtom.set("idle");
  usersListErrorAtom.set(null);
}, "resetUsersListState");

/** Список пользователей, включая удалённых (`includeDeleted: true`). */
export const loadUsersList = action(async () => {
  usersListStatusAtom.set("loading");
  usersListErrorAtom.set(null);
  try {
    const list = await wrap(usersApi.findAll({ includeDeleted: true }));
    usersListAtom.set(list);
    usersListStatusAtom.set("idle");
  } catch (e) {
    usersListStatusAtom.set("error");
    usersListErrorAtom.set(resolveApiErrorMessage(e));
  }
}, "loadUsersList");
