import { useAction } from "@reatom/react";
import { useEffect } from "react";

import type { TripRead } from "@/entities/trip";
import { TripStatus } from "@/entities/trip";
import {
  useLiveTripOverlay,
} from "@/features/trip-realtime/hooks/use-live-trip";
import {
  registerTripWatch,
  unregisterTripWatch,
} from "@/features/trip-realtime/model/live-trip-overlay";
import { isOngoingTripStatus } from "@/shared/lib/is-ongoing-trip-status";

type Options = {
  tripId: string;
  trip: TripRead | null | undefined;
  onFinished?: () => void;
};

/** Subscribe to live updates for an ongoing trip; optional reload when status becomes FINISHED. */
export function useOngoingTripWatch({ tripId, trip, onFinished }: Options) {
  const watchTrip = useAction(registerTripWatch);
  const unwatchTrip = useAction(unregisterTripWatch);
  const tripOverlay = useLiveTripOverlay(tripId);

  useEffect(() => {
    if (!trip || !isOngoingTripStatus(trip.status)) {
      return;
    }
    watchTrip(trip.id);
    return () => {
      unwatchTrip(trip.id);
    };
  }, [trip?.id, trip?.status, watchTrip, unwatchTrip, trip]);

  useEffect(() => {
    if (tripOverlay?.status !== TripStatus.FINISHED) {
      return;
    }
    onFinished?.();
  }, [onFinished, tripOverlay?.status, tripOverlay?.updatedAt]);

  return { tripOverlay };
}
