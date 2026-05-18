import { useAction, useAtom } from "@reatom/react";
import { useEffect, useMemo } from "react";

import type { TripRead } from "@/entities/trip";
import type { TripNotificationRead } from "@/entities/manager-violation-notice";
import {
  loadTripViewUsers,
  tripViewUsersByIdAtom,
} from "@/features/trips/model/trip-view-page-state";

type Args = {
  trip: TripRead | null | undefined;
  emailNotices: TripNotificationRead[];
};

export function useTripViewUsers({ trip, emailNotices }: Args) {
  const [userById] = useAtom(tripViewUsersByIdAtom);
  const loadUsers = useAction(loadTripViewUsers);

  const userIdsForLinks = useMemo(() => {
    const ids = new Set<string>();
    if (trip?.userId?.trim()) {
      ids.add(trip.userId.trim());
    }
    for (const n of emailNotices) {
      if (n.userId?.trim()) {
        ids.add(n.userId.trim());
      }
    }
    return [...ids].sort();
  }, [trip?.userId, emailNotices]);

  useEffect(() => {
    void loadUsers(userIdsForLinks);
  }, [userIdsForLinks, loadUsers]);

  return { userById };
}
