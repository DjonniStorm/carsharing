import type { GeozoneRead } from "@/entities/geozone";
import { GeozoneType } from "@/entities/geozone";
import {
  matchesSearchHaystack,
  normalizeSearchQuery,
} from "@/shared/lib/matches-search-haystack";

export function filterGeozonesList(
  rows: GeozoneRead[],
  opts: {
    debouncedName: string;
    typeFilter: GeozoneType[];
  },
): GeozoneRead[] {
  const list = rows.filter((z) => z.deletedAt == null);
  const q = normalizeSearchQuery(opts.debouncedName);
  const typesSet = opts.typeFilter.length > 0 ? new Set(opts.typeFilter) : null;

  return list.filter((z) => {
    if (typesSet !== null && !typesSet.has(z.type)) {
      return false;
    }
    if (!q) {
      return true;
    }
    const hay = `${z.name}\n${z.id}`;
    return matchesSearchHaystack(hay, q);
  });
}
