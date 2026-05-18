const EARTH_RADIUS_M = 6_371_000;

/** Расстояние между двумя WGS84-точками в метрах. */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/** Сумма сегментов по упорядоченным точкам (lat, lon). */
export function pathDistanceMeters(
  points: ReadonlyArray<{ lat: number; lon: number }>,
): number {
  if (points.length < 2) {
    return 0;
  }
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    sum += haversineMeters(a.lat, a.lon, b.lat, b.lon);
  }
  return sum;
}
