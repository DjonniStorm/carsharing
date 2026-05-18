import { useAction, useAtom } from "@reatom/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { GeozoneType } from "@/entities/geozone";
import type { GeozoneBoundingBoxQuery } from "@/features/geozones/api";
import {
  dashboardGeozonesAtom,
  dashboardGeozonesErrorAtom,
  dashboardGeozonesStatusAtom,
  loadDashboardGeozonesForBBox,
  resetDashboardGeozonesState,
} from "@/features/geozones/model/geozones-state";
import { DEFAULT_MAP_GEOZONE_BOUNDS } from "@/shared/config/map-defaults";

const GEOZONE_VIEWPORT_DEBOUNCE_MS = 1000;

export function useDashboardMapViewport() {
  const [geozones] = useAtom(dashboardGeozonesAtom);
  const [geozonesError] = useAtom(dashboardGeozonesErrorAtom);
  const [geozonesLoadStatus] = useAtom(dashboardGeozonesStatusAtom);

  const [showRentalGeozones, setShowRentalGeozones] = useState(true);
  const [showParkingGeozones, setShowParkingGeozones] = useState(true);

  const viewportBBoxRef = useRef<GeozoneBoundingBoxQuery | null>(null);
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showRentalRef = useRef(showRentalGeozones);
  const showParkingRef = useRef(showParkingGeozones);
  showRentalRef.current = showRentalGeozones;
  showParkingRef.current = showParkingGeozones;

  const loadGeozonesBBox = useAction(loadDashboardGeozonesForBBox);
  const resetDashboardGeozones = useAction(resetDashboardGeozonesState);

  const fetchGeozonesForCurrentFilters = useCallback(() => {
    if (!showRentalRef.current && !showParkingRef.current) {
      resetDashboardGeozones();
      return;
    }
    const types: GeozoneType[] = [];
    if (showRentalRef.current) {
      types.push(GeozoneType.RENTAL);
    }
    if (showParkingRef.current) {
      types.push(GeozoneType.PARKING);
    }
    const bbox = viewportBBoxRef.current ?? DEFAULT_MAP_GEOZONE_BOUNDS;
    void loadGeozonesBBox({
      ...bbox,
      types,
    });
  }, [loadGeozonesBBox, resetDashboardGeozones]);

  const scheduleFetchAfterViewportMove = useCallback(() => {
    if (viewportDebounceRef.current) {
      clearTimeout(viewportDebounceRef.current);
    }
    viewportDebounceRef.current = setTimeout(() => {
      viewportDebounceRef.current = null;
      fetchGeozonesForCurrentFilters();
    }, GEOZONE_VIEWPORT_DEBOUNCE_MS);
  }, [fetchGeozonesForCurrentFilters]);

  const handleMapViewportBounds = useCallback(
    (bbox: GeozoneBoundingBoxQuery) => {
      viewportBBoxRef.current = bbox;
      scheduleFetchAfterViewportMove();
    },
    [scheduleFetchAfterViewportMove],
  );

  useEffect(() => {
    if (viewportDebounceRef.current) {
      clearTimeout(viewportDebounceRef.current);
      viewportDebounceRef.current = null;
    }
    fetchGeozonesForCurrentFilters();
  }, [showRentalGeozones, showParkingGeozones, fetchGeozonesForCurrentFilters]);

  useEffect(() => {
    return () => {
      if (viewportDebounceRef.current) {
        clearTimeout(viewportDebounceRef.current);
      }
    };
  }, []);

  return {
    geozones,
    geozonesError,
    geozonesLoadStatus,
    showRentalGeozones,
    setShowRentalGeozones,
    showParkingGeozones,
    setShowParkingGeozones,
    handleMapViewportBounds,
  };
}
