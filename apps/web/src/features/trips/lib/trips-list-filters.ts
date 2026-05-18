import type { TripRead } from "@/entities/trip";
import type { TripStatus } from "@/entities/trip";
import {
  matchesSearchHaystack,
  normalizeSearchQuery,
} from "@/shared/lib/matches-search-haystack";

export function filterTripsList(
  rows: TripRead[],
  opts: {
    debouncedSearch: string;
    statusFilter: TripStatus[];
  },
): TripRead[] {
  const q = normalizeSearchQuery(opts.debouncedSearch);
  const statusSet =
    opts.statusFilter.length > 0 ? new Set(opts.statusFilter) : null;

  return rows.filter((trip) => {
    if (statusSet !== null && !statusSet.has(trip.status)) {
      return false;
    }
    if (!q) {
      return true;
    }
    const hay = [
      trip.id,
      trip.userId,
      trip.carId,
      trip.carPlateSnapshot ?? "",
      trip.carDisplayNameSnapshot ?? "",
    ].join("\n");
    return matchesSearchHaystack(hay, q);
  });
}

export function sortTripsByStartedDesc(rows: TripRead[]): TripRead[] {
  return [...rows].sort((a, b) => {
    const ta = new Date(a.startedAt).getTime();
    const tb = new Date(b.startedAt).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}
