import type { CarRead } from "@/entities/car";
import { CarStatus } from "@/entities/car";
import {
  matchesSearchHaystack,
  normalizeSearchQuery,
} from "@/shared/lib/matches-search-haystack";

export function filterCarsList(
  fleet: CarRead[],
  opts: {
    debouncedQuery: string;
    statusFilter: string | null;
  },
): CarRead[] {
  const statusNum =
    opts.statusFilter !== null
      ? (Number(opts.statusFilter) as CarStatus)
      : null;
  const q = normalizeSearchQuery(opts.debouncedQuery);

  return fleet.filter((car) => {
    if (statusNum !== null && car.carStatus !== statusNum) {
      return false;
    }
    if (!q) {
      return true;
    }
    const hay = [car.licensePlate, car.brand, car.model, car.id]
      .filter(Boolean)
      .join("\n");
    return matchesSearchHaystack(hay, q);
  });
}
