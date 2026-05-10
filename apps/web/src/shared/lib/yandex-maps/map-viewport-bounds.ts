import type { GeozoneBoundingBoxQuery } from "@/features/geozones/api";

import type { YMapLngLat } from "@/shared/lib/yandex-maps/ymaps3";

/**
 * Превращает `location.bounds` из события {@link YMaps3Global.YMapListener} `onUpdate`
 * в параметры `GET /geozones/bounding-box`. Углы могут приходить в любом порядке.
 */
export function ymapsBoundsToGeozoneQuery(
  bounds: YMapLngLat[] | undefined | null,
): GeozoneBoundingBoxQuery | null {
  if (!bounds?.length) {
    return null;
  }
  const lons: number[] = [];
  const lats: number[] = [];
  for (const pt of bounds) {
    if (!pt || pt.length < 2) {
      continue;
    }
    const lon = pt[0];
    const lat = pt[1];
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      continue;
    }
    lons.push(lon);
    lats.push(lat);
  }
  if (lons.length < 2 || lats.length < 2) {
    return null;
  }
  return {
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}
