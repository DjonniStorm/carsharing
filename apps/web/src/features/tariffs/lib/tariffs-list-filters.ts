import type { TariffRead } from "@/entities/tariff";
import {
  matchesSearchHaystack,
  normalizeSearchQuery,
} from "@/shared/lib/matches-search-haystack";

export type TariffPresetFilter = "" | "default" | "nonDefault";

export function filterTariffsList(
  rows: TariffRead[],
  opts: {
    debouncedSearch: string;
    presetFilter: TariffPresetFilter;
    hideDeleted: boolean;
  },
): TariffRead[] {
  const q = normalizeSearchQuery(opts.debouncedSearch);

  return rows.filter((row) => {
    if (opts.hideDeleted && row.isDeleted) {
      return false;
    }
    if (opts.presetFilter === "default" && !row.isDefault) {
      return false;
    }
    if (opts.presetFilter === "nonDefault" && row.isDefault) {
      return false;
    }
    if (!q) {
      return true;
    }
    const hay = `${row.name}\n${row.id}`;
    return matchesSearchHaystack(hay, q);
  });
}
