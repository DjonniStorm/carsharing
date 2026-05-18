import type {
  TripHistoryFullRead,
  TripHistoryShortInfoRead,
} from "@/entities/trip/model/trip-history-contracts";
import { BaseApiClient } from "@/shared/api";
import type { AccessTokenGetter } from "@/shared/api/base-api-client";

function optionalQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") {
      sp.set(k, v);
    }
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export type TripHistoryListQuery = {
  /** Для MANAGER/SYSTEM_ADMIN — чья история (водитель и т.д.). */
  userId?: string;
  limit?: number;
  offset?: number;
  /** ISO-8601, границы по `trip.startedAt`. */
  startedAfter?: string;
  startedBefore?: string;
  /** Только завершённые по `finishedAt`. */
  finishedAfter?: string;
  finishedBefore?: string;
};

export class TripHistoryApi extends BaseApiClient {
  constructor(baseUrl: string, getAccessToken: AccessTokenGetter) {
    super(baseUrl, getAccessToken);
  }

  /** Список поездок с нарушениями по пользователю (`GET /trip-history`). */
  listShort(
    query: TripHistoryListQuery = {},
  ): Promise<TripHistoryShortInfoRead[]> {
    return this.getJson<TripHistoryShortInfoRead[]>(
      `/trip-history${optionalQuery({
        userId: query.userId,
        limit: query.limit !== undefined ? String(query.limit) : undefined,
        offset: query.offset !== undefined ? String(query.offset) : undefined,
        startedAfter: query.startedAfter,
        startedBefore: query.startedBefore,
        finishedAfter: query.finishedAfter,
        finishedBefore: query.finishedBefore,
      })}`,
    );
  }

  /** Карточка поездки для истории: поездка + авто + нарушения (без точек телеметрии). */
  getShort(tripId: string): Promise<TripHistoryShortInfoRead> {
    return this.getJson<TripHistoryShortInfoRead>(
      `/trip-history/${encodeURIComponent(tripId)}`,
    );
  }

  /** Полная карточка: поездка + авто + нарушения + точки телеметрии. */
  getFull(tripId: string): Promise<TripHistoryFullRead> {
    return this.getJson<TripHistoryFullRead>(
      `/trip-history/${encodeURIComponent(tripId)}/full`,
    );
  }
}
