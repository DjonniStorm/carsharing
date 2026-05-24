import { useMemo } from "react";
import { useAtom } from "@reatom/react";

import type { ViolationRead } from "@/entities/violation";
import { useLiveTrip } from "@/features/trip-realtime/hooks/use-live-trip";
import { useOngoingTripWatch } from "@/features/trip-realtime/hooks/use-ongoing-trip-watch";
import { emailNoticesPhaseFromStatus } from "@/features/trips/lib/trip-view-present";
import {
  tripViewEmailNoticesAtom,
  tripViewEmailNoticesErrorAtom,
  tripViewEmailNoticesStatusAtom,
} from "@/features/trips/model/trip-view-page-state";

import { useTripViewLoad } from "@/pages/trip/hooks/use-trip-view-load";
import { useTripViewNoticeModal } from "@/pages/trip/hooks/use-trip-view-notice-modal";
import { useTripViewUsers } from "@/pages/trip/hooks/use-trip-view-users";

export function useTripViewPage() {
  const load = useTripViewLoad();
  const [emailNotices] = useAtom(tripViewEmailNoticesAtom);
  const [emailNoticesStatus] = useAtom(tripViewEmailNoticesStatusAtom);
  const [emailNoticesError] = useAtom(tripViewEmailNoticesErrorAtom);

  const shownTrip = useLiveTrip(load.trip) ?? load.trip;

  useOngoingTripWatch({
    tripId: load.tripId,
    trip: load.trip,
    onFinished: load.reloadFull,
  });

  const { userById } = useTripViewUsers({
    trip: load.trip,
    emailNotices,
  });

  const modal = useTripViewNoticeModal();

  const violationById = useMemo(() => {
    const m = new Map<string, ViolationRead>();
    for (const violation of load.violations) {
      m.set(violation.id, violation);
    }
    return m;
  }, [load.violations]);

  const emailNoticesPhase = emailNoticesPhaseFromStatus(emailNoticesStatus);

  return {
    tripId: load.tripId,
    trip: load.trip,
    shownTrip,
    car: load.car,
    violations: load.violations,
    violationById,
    routePoints: load.routePoints,
    tripMapGeozone: load.tripMapGeozone,
    loading: load.loading,
    errorMessage: load.errorMessage,
    tripMapZoneLoading: load.tripMapZoneLoading,
    ...modal,
    loadEmailNotices: load.reloadEmailNotices,
    emailNotices,
    emailNoticesPhase,
    emailNoticesError,
    userById,
  };
}
