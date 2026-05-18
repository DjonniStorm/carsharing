import type { ViolationRead } from "@/entities/violation";
import { ViolationStatus } from "@/entities/violation";
import {
  matchesSearchHaystack,
  normalizeSearchQuery,
} from "@/shared/lib/matches-search-haystack";

export function filterViolationsList(
  rows: ViolationRead[],
  opts: {
    debouncedSearch: string;
    typeFilter: ViolationStatus[];
  },
): ViolationRead[] {
  const q = normalizeSearchQuery(opts.debouncedSearch);
  const typesSet =
    opts.typeFilter.length > 0 ? new Set(opts.typeFilter) : null;

  return rows.filter((v) => {
    if (typesSet !== null && !typesSet.has(v.type)) {
      return false;
    }
    if (!q) {
      return true;
    }
    const hay = `${v.description}\n${v.tripId}\n${v.id}`;
    return matchesSearchHaystack(hay, q);
  });
}
