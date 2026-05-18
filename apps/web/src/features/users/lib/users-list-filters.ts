import type { ReadUser } from "@/entities/user";
import { UserRole } from "@/entities/user";
import {
  matchesSearchHaystack,
  normalizeSearchQuery,
} from "@/shared/lib/matches-search-haystack";

export type UsersStatusFilter = "all" | "active" | "inactive" | "deleted";

export function matchesAccountStatus(
  user: ReadUser,
  filter: UsersStatusFilter,
): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "deleted") {
    return user.isDeleted === true;
  }
  if (user.isDeleted === true) {
    return false;
  }
  if (filter === "inactive") {
    return user.isActive === false;
  }
  if (filter === "active") {
    return user.isActive !== false;
  }
  return true;
}

export function filterUsersList(
  users: ReadUser[],
  opts: {
    debouncedQuery: string;
    roleFilter: string | null;
    statusFilter: UsersStatusFilter;
  },
): ReadUser[] {
  const q = normalizeSearchQuery(opts.debouncedQuery);
  const roleNum =
    opts.roleFilter !== null && opts.roleFilter !== ""
      ? (Number(opts.roleFilter) as UserRole)
      : null;

  return users.filter((u) => {
    if (roleNum !== null && Number(u.role) !== roleNum) {
      return false;
    }
    if (!matchesAccountStatus(u, opts.statusFilter)) {
      return false;
    }
    if (!q) {
      return true;
    }
    const hay = `${u.name}\n${u.email}\n${u.phone}\n${u.id}`;
    return matchesSearchHaystack(hay, q);
  });
}
