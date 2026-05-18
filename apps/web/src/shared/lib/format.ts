export function formatCardDateTime(
  iso: string | null | undefined,
  locale?: string,
): string {
  if (iso == null || iso === "") {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString(locale);
}

export function formatCoord(
  lat: number | null,
  lon: number | null,
): string {
  if (lat == null || lon == null) {
    return "—";
  }
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export function formatMoney(
  n: number | null | undefined,
  locale?: string,
): string {
  if (n == null || !Number.isFinite(Number(n))) {
    return "—";
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(n));
}

/** Дистанция в км с двумя знаками; при отсутствии метров — fallback на legacy `distance`. */
export function formatTripDistanceKm(
  distanceMeters: number | null | undefined,
  legacyDistance?: number | null,
): string {
  if (distanceMeters != null && Number.isFinite(distanceMeters)) {
    return (distanceMeters / 1000).toFixed(2);
  }
  if (legacyDistance != null && Number.isFinite(legacyDistance)) {
    return Number(legacyDistance).toFixed(2);
  }
  return "—";
}
