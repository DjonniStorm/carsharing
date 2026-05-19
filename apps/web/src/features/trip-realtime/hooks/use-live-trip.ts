import { useMemo } from "react";
import { useAtom } from "@reatom/react";

import type { TripRead } from "@/entities/trip";

import { mergeTripRead } from "../lib/merge-trip-with-overlay";
import { liveTripOverlayAtom } from "../model/live-trip-overlay";

export function useLiveTrip(
  base: TripRead | null | undefined,
): TripRead | null {
  const [overlays] = useAtom(liveTripOverlayAtom);

  return useMemo(() => {
    if (!base) {
      return null;
    }
    return mergeTripRead(base, overlays[base.id]);
  }, [base, overlays]);
}

export function useLiveTripOverlay(tripId: string | null | undefined) {
  const [overlays] = useAtom(liveTripOverlayAtom);
  if (!tripId) {
    return undefined;
  }
  return overlays[tripId];
}
