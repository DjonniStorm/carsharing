import { useNavigate, useParams } from "@tanstack/react-router";
import { useAction, useAtom } from "@reatom/react";
import { useCallback, useEffect } from "react";

import type { ViolationRead } from "@/entities/violation";

import {
  loadTripGeozoneForMap,
  loadTripHistoryFull,
  resetTripHistoryView,
  tripGeozoneForMapAtom,
  tripGeozoneForMapStatusAtom,
  tripHistoryFullAtom,
  tripHistoryFullErrorAtom,
  tripHistoryFullStatusAtom,
} from "@/features/trips/model/trip-history-view";
import {
  loadTripViewEmailNotices,
  resetTripViewPageExtras,
} from "@/features/trips/model/trip-view-page-state";
import { ROUTES } from "@/shared/config/routes-paths";

const EMPTY_VIOLATIONS: ViolationRead[] = [];

export function useTripViewLoad() {
  const navigate = useNavigate();
  const { tripId } = useParams({
    from: "/dashboard-shell/dashboard/trips/$tripId",
  });

  const [data] = useAtom(tripHistoryFullAtom);
  const [status] = useAtom(tripHistoryFullStatusAtom);
  const [errorState] = useAtom(tripHistoryFullErrorAtom);
  const [tripMapGeozone] = useAtom(tripGeozoneForMapAtom);
  const [tripGeozoneStatus] = useAtom(tripGeozoneForMapStatusAtom);

  const loadFull = useAction(loadTripHistoryFull);
  const loadZone = useAction(loadTripGeozoneForMap);
  const resetView = useAction(resetTripHistoryView);
  const resetExtras = useAction(resetTripViewPageExtras);
  const loadEmailNotices = useAction(loadTripViewEmailNotices);

  useEffect(() => {
    resetView();
    resetExtras();
    void loadFull(tripId);
    void loadEmailNotices(tripId);
    return () => {
      resetView();
      resetExtras();
    };
    // Reatom actions are stable; reload only when tripId changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tripId-only load lifecycle
  }, [tripId]);

  const versionId = data?.trip?.geoZoneVersionId;
  useEffect(() => {
    void loadZone(versionId);
  }, [versionId, loadZone]);

  useEffect(() => {
    if (!errorState?.status) {
      return;
    }
    if (errorState.status === 404) {
      void navigate({
        to: ROUTES.error,
        replace: true,
        search: { reason: "trip_not_found" },
      });
    } else if (errorState.status === 403) {
      void navigate({
        to: ROUTES.error,
        replace: true,
        search: { reason: "trip_forbidden" },
      });
    }
  }, [errorState?.status, navigate]);

  const trip = data?.trip;
  const car = data?.car;
  const violations = data?.violations ?? EMPTY_VIOLATIONS;
  const routePoints = data?.points ?? [];
  const loading = status === "loading" && !data;
  const errorMessage =
    errorState && errorState.status !== 404 && errorState.status !== 403
      ? errorState.message
      : null;
  const tripMapZoneLoading = tripGeozoneStatus === "loading";

  const reloadFull = useCallback(
    () => loadFull(tripId),
    [tripId, loadFull],
  );
  const reloadEmailNotices = useCallback(
    () => loadEmailNotices(tripId),
    [tripId, loadEmailNotices],
  );

  return {
    tripId,
    trip,
    car,
    violations,
    routePoints,
    tripMapGeozone,
    loading,
    errorMessage,
    tripMapZoneLoading,
    reloadFull,
    reloadEmailNotices,
  };
}
