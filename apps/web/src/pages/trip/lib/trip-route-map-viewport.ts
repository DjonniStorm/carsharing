import type { GeoJSONMultiPolygon } from "@/entities/geozone";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/shared/config/map-defaults";
import type { YMapLngLat } from "@/shared/lib/yandex-maps/ymaps3";

function considerPoint(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number,
  lon: number,
  lat: number,
): [number, number, number, number] {
  return [
    Math.min(minLon, lon),
    Math.min(minLat, lat),
    Math.max(maxLon, lon),
    Math.max(maxLat, lat),
  ];
}

/** Центр и zoom по маршруту и (опционально) полигону геозоны. */
export function tripRouteMapViewport(
  route: YMapLngLat[],
  zoneGeometry: GeoJSONMultiPolygon | null | undefined,
): { center: YMapLngLat; zoom: number } {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  let any = false;

  const use = (lon: number, lat: number) => {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return;
    }
    any = true;
    [minLon, minLat, maxLon, maxLat] = considerPoint(
      minLon,
      minLat,
      maxLon,
      maxLat,
      lon,
      lat,
    );
  };

  for (const [lon, lat] of route) {
    use(lon, lat);
  }

  if (zoneGeometry?.type === "MultiPolygon" && zoneGeometry.coordinates) {
    for (const polygon of zoneGeometry.coordinates) {
      for (const ring of polygon) {
        for (const pt of ring) {
          if (pt.length >= 2) {
            use(pt[0], pt[1]);
          }
        }
      }
    }
  }

  if (!any) {
    return { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM };
  }

  const center: YMapLngLat = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
  const span = Math.max(maxLon - minLon, maxLat - minLat);
  let zoom = DEFAULT_MAP_ZOOM;
  if (span > 1) zoom = 9;
  else if (span > 0.5) zoom = 10;
  else if (span > 0.2) zoom = 11;
  else if (span > 0.08) zoom = 12;
  else if (span > 0.03) zoom = 13;
  else if (span > 0.015) zoom = 14;
  else if (span > 0.008) zoom = 15;
  else zoom = 16;

  return { center, zoom };
}
