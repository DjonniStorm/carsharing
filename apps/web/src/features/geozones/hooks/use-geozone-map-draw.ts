import { useCallback, useEffect, useState } from "react";

import { FIELD_LIMITS } from "@carsharing/validation";

import type { GeozoneDrawMode } from "@/features/geozones/create-geozone/ui/geozone-draw-map";
import {
  ensureClosedRing,
  rectangleFromDiagonal,
} from "@/features/geozones/lib/geojson-ring";
import type { YMapLngLat } from "@/shared/lib/yandex-maps/ymaps3";

type CompletePolygonOptions = {
  onValidationError?: (message: string) => void;
  onSuccess?: () => void;
};

const POLYGON_VERTICES_MAX = FIELD_LIMITS.GEOZONE_POLYGON_VERTICES_MAX;

export function useGeozoneMapDraw(opts?: {
  resetGeometryOnDrawModeChange?: boolean;
}) {
  const resetOnModeChange = opts?.resetGeometryOnDrawModeChange ?? false;

  const [drawMode, setDrawMode] = useState<GeozoneDrawMode>("rectangle");
  const [polygonVertices, setPolygonVertices] = useState<YMapLngLat[]>([]);
  const [rectangleAnchor, setRectangleAnchor] = useState<YMapLngLat | null>(
    null,
  );
  const [closedRing, setClosedRing] = useState<YMapLngLat[] | null>(null);

  useEffect(() => {
    if (!resetOnModeChange) {
      return;
    }
    setPolygonVertices([]);
    setRectangleAnchor(null);
    setClosedRing(null);
  }, [drawMode, resetOnModeChange]);

  const handleDrawModeChange = useCallback((mode: GeozoneDrawMode) => {
    setDrawMode(mode);
    setPolygonVertices([]);
    setRectangleAnchor(null);
  }, []);

  const clearGeometry = useCallback(() => {
    setPolygonVertices([]);
    setRectangleAnchor(null);
    setClosedRing(null);
  }, []);

  const setClosedRingFromHydration = useCallback(
    (ring: YMapLngLat[] | null) => {
      setClosedRing(ring);
      setPolygonVertices([]);
      setRectangleAnchor(null);
    },
    [],
  );

  const handleMapClick = useCallback(
    (lngLat: YMapLngLat) => {
      if (closedRing) {
        return;
      }
      if (drawMode === "rectangle") {
        if (!rectangleAnchor) {
          setRectangleAnchor(lngLat);
          return;
        }
        setClosedRing(rectangleFromDiagonal(rectangleAnchor, lngLat));
        setRectangleAnchor(null);
        return;
      }
      setPolygonVertices((vertices) =>
        vertices.length >= POLYGON_VERTICES_MAX
          ? vertices
          : [...vertices, lngLat],
      );
    },
    [closedRing, drawMode, rectangleAnchor],
  );

  const completePolygon = useCallback(
    (options?: CompletePolygonOptions) => {
      if (polygonVertices.length < 3) {
        options?.onValidationError?.("");
        return false;
      }
      options?.onSuccess?.();
      setClosedRing(ensureClosedRing(polygonVertices));
      setPolygonVertices([]);
      return true;
    },
    [polygonVertices],
  );

  const undoVertex = useCallback(() => {
    setPolygonVertices((vertices) => vertices.slice(0, -1));
  }, []);

  return {
    drawMode,
    setDrawMode,
    handleDrawModeChange,
    polygonVertices,
    closedRing,
    setClosedRing,
    rectangleAnchor,
    handleMapClick,
    clearGeometry,
    undoVertex,
    completePolygon,
    setClosedRingFromHydration,
  };
}
