import type { GeoJSONMultiPolygon } from "@/entities/geozone";

import type { YMapLngLat } from "@/shared/lib/yandex-maps/ymaps3";

/** Замыкает кольцо полигона (первая точка = последней). */
export function ensureClosedRing(ring: YMapLngLat[]): YMapLngLat[] {
  if (ring.length === 0) {
    return ring;
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    return ring;
  }
  return [...ring, first];
}

/** Одна оболочка без дыр → RFC 7946 MultiPolygon. */
export function ringToMultiPolygon(ring: YMapLngLat[]): GeoJSONMultiPolygon {
  const closed = ensureClosedRing(ring);
  return {
    type: "MultiPolygon",
    coordinates: [[closed.map(([lon, lat]) => [lon, lat])]],
  };
}

/** Прямоугольник по диагонали (порядок обхода для простого полигона). */
export function rectangleFromDiagonal(a: YMapLngLat, b: YMapLngLat): YMapLngLat[] {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const minLon = Math.min(lng1, lng2);
  const maxLon = Math.max(lng1, lng2);
  const minLat = Math.min(lat1, lat2);
  const maxLat = Math.max(lat1, lat2);
  return [
    [minLon, minLat],
    [maxLon, minLat],
    [maxLon, maxLat],
    [minLon, maxLat],
    [minLon, minLat],
  ];
}

/** Минимум треугольник: 3 уникальные вершины + замыкание → 4 точки в кольце. */
export function isValidClosedRing(ring: YMapLngLat[]): boolean {
  return ring.length >= 4;
}

/** Внешнее кольцо первого полигона MultiPolygon → замкнутое кольцо [lon, lat]. */
export function multiPolygonFirstOuterRing(
  mp: GeoJSONMultiPolygon,
): YMapLngLat[] | null {
  const ring = mp.coordinates?.[0]?.[0];
  if (!Array.isArray(ring) || ring.length < 4) {
    return null;
  }
  const out: YMapLngLat[] = [];
  for (const p of ring) {
    if (!Array.isArray(p) || p.length < 2) {
      return null;
    }
    out.push([Number(p[0]), Number(p[1])]);
  }
  return ensureClosedRing(out);
}
