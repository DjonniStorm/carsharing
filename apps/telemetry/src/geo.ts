export type Position = {
  lat: number;
  lon: number;
};

export type RouteBounds = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function toDeg(value: number): number {
  return (value * 180) / Math.PI;
}

export function clampLatitude(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

export function normalizeLongitude(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export function centerOfBounds(bounds: RouteBounds): Position {
  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lon: (bounds.minLon + bounds.maxLon) / 2,
  };
}

export function isInsideBounds(position: Position, bounds: RouteBounds): boolean {
  return (
    position.lat >= bounds.minLat &&
    position.lat <= bounds.maxLat &&
    position.lon >= bounds.minLon &&
    position.lon <= bounds.maxLon
  );
}

export function clampPositionToBounds(position: Position, bounds: RouteBounds): Position {
  return {
    lat: Math.max(bounds.minLat, Math.min(bounds.maxLat, position.lat)),
    lon: Math.max(bounds.minLon, Math.min(bounds.maxLon, position.lon)),
  };
}

export function moveByBearing(
  position: Position,
  bearingDeg: number,
  distanceMeters: number,
): Position {
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(position.lat);
  const lon1 = toRad(position.lon);
  const ratio = distanceMeters / EARTH_RADIUS_METERS;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(ratio) + Math.cos(lat1) * Math.sin(ratio) * Math.cos(bearing),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(ratio) * Math.cos(lat1),
      Math.cos(ratio) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: clampLatitude(toDeg(lat2)),
    lon: normalizeLongitude(toDeg(lon2)),
  };
}

export function distanceMeters(from: Position, to: Position): number {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const deltaLat = toRad(to.lat - from.lat);
  const deltaLon = toRad(to.lon - from.lon);
  const a =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingDeg(from: Position, to: Position): number {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const deltaLon = toRad(to.lon - from.lon);
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function interpolatePosition(from: Position, to: Position, ratio: number): Position {
  const clamped = Math.max(0, Math.min(1, ratio));
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lon: from.lon + (to.lon - from.lon) * clamped,
  };
}

export function randomPositionInBounds(bounds: RouteBounds, seedOffset = 0): Position {
  const phase = Date.now() * 0.0001 + seedOffset;
  return {
    lat: bounds.minLat + (bounds.maxLat - bounds.minLat) * (Math.sin(phase * 1.7) * 0.5 + 0.5),
    lon: bounds.minLon + (bounds.maxLon - bounds.minLon) * (Math.cos(phase * 1.3) * 0.5 + 0.5),
  };
}

export function moveInsideBounds(
  position: Position,
  bearingDeg: number,
  distanceMeters: number,
  bounds: RouteBounds,
  routeSeed: number,
): { position: Position; bearingDeg: number } {
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const phase = routeSeed * 0.61803398875 + Date.now() / 60_000;
  const target = {
    lat: centerLat + (bounds.maxLat - bounds.minLat) * 0.35 * Math.sin(phase * 1.7),
    lon: centerLon + (bounds.maxLon - bounds.minLon) * 0.35 * Math.cos(phase * 1.3),
  };
  const desiredBearing =
    (Math.atan2(target.lon - position.lon, target.lat - position.lat) * 180) / Math.PI;
  let nextBearing = bearingDeg * 0.72 + desiredBearing * 0.28;
  let nextPosition = moveByBearing(position, nextBearing, distanceMeters);

  if (
    nextPosition.lat < bounds.minLat ||
    nextPosition.lat > bounds.maxLat ||
    nextPosition.lon < bounds.minLon ||
    nextPosition.lon > bounds.maxLon
  ) {
    nextBearing = (Math.atan2(centerLon - position.lon, centerLat - position.lat) * 180) / Math.PI;
    nextPosition = moveByBearing(position, nextBearing, distanceMeters);
  }

  return {
    position: {
      lat: Math.max(bounds.minLat, Math.min(bounds.maxLat, nextPosition.lat)),
      lon: Math.max(bounds.minLon, Math.min(bounds.maxLon, nextPosition.lon)),
    },
    bearingDeg: nextBearing,
  };
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
