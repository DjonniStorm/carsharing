import { useAction, useAtom } from "@reatom/react";
import { useEffect } from "react";

import {
  dashboardSelectedCarAtom,
  dashboardSelectedCarErrorAtom,
  dashboardSelectedCarStatusAtom,
  loadDashboardSelectedCar,
  resetDashboardSelectedCar,
} from "@/features/dashboard/model/dashboard-selected-car-state";
import { useLiveTrip } from "@/features/trip-realtime/hooks/use-live-trip";
import { useOngoingTripWatch } from "@/features/trip-realtime/hooks/use-ongoing-trip-watch";

export function useDashboardSelectedCarLoad(carId: string | null) {
  const [data] = useAtom(dashboardSelectedCarAtom);
  const [status] = useAtom(dashboardSelectedCarStatusAtom);
  const [error] = useAtom(dashboardSelectedCarErrorAtom);

  const load = useAction(loadDashboardSelectedCar);
  const reset = useAction(resetDashboardSelectedCar);

  useEffect(() => {
    if (!carId) {
      reset();
      return;
    }
    reset();
    void load(carId);
    return () => {
      reset();
    };
  }, [carId, load, reset]);

  const ongoingTrip = data?.ongoingTrip ?? null;
  const liveOngoingTrip = useLiveTrip(ongoingTrip) ?? ongoingTrip;

  useOngoingTripWatch({
    tripId: ongoingTrip?.id ?? "",
    trip: ongoingTrip,
  });

  return {
    data,
    loading: status === "loading",
    error,
    liveOngoingTrip,
  };
}
