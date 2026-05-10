import type { TripHistoryShortInfoRead } from "@/entities/trip/model/trip-history-contracts";
import type { ViolationRead } from "@/entities/violation";

/** Собирает уникальные нарушения из строк истории поездок, новее сверху. */
export function violationsFromTripHistoryRows(
  rows: TripHistoryShortInfoRead[],
): ViolationRead[] {
  const byId = new Map<string, ViolationRead>();
  for (const row of rows) {
    for (const v of row.violations ?? []) {
      byId.set(v.id, v);
    }
  }
  return [...byId.values()].sort((a, b) => {
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });
}
