export type TelemetryConfig = {
  backendUrl: string;
  carId: string;
  telemetryKey: string;
  routingUrl?: string;
  routingProfile: string;
  idleIntervalMs: number;
  activeIntervalMs: number;
  pollIntervalMs: number;
  initialLat: number;
  initialLon: number;
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
  minSpeedKmh: number;
  maxSpeedKmh: number;
  initialFuelLevel: number;
  routeSeed: number;
  speedingChance: number;
  destinationRefreshMeters: number;
  source: string;
};

function readRequired(name: string): string {
  const value = Bun.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function readNumber(name: string, fallback: number): number {
  const raw = Bun.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
  return value;
}

function seconds(name: string, fallback: number): number {
  const value = readNumber(name, fallback);
  if (value <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
  return value * 1000;
}

export function readConfig(): TelemetryConfig {
  const minSpeedKmh = readNumber('MIN_SPEED_KMH', 12);
  const maxSpeedKmh = readNumber('MAX_SPEED_KMH', 54);
  if (minSpeedKmh > maxSpeedKmh) {
    throw new Error('MIN_SPEED_KMH must be less or equal MAX_SPEED_KMH');
  }

  return {
    backendUrl: readRequired('BACKEND_URL').replace(/\/+$/, ''),
    carId: readRequired('CAR_ID'),
    telemetryKey: readRequired('TELEMETRY_DEVICE_KEY'),
    routingUrl: Bun.env.ROUTING_URL?.trim().replace(/\/+$/, ''),
    routingProfile: Bun.env.ROUTING_PROFILE?.trim() || 'driving',
    idleIntervalMs: seconds('IDLE_TELEMETRY_INTERVAL_SEC', 60),
    activeIntervalMs: seconds('ACTIVE_TELEMETRY_INTERVAL_SEC', 10),
    pollIntervalMs: seconds('TRIP_POLL_INTERVAL_SEC', 5),
    initialLat: readNumber('INITIAL_LAT', 46.3497),
    initialLon: readNumber('INITIAL_LON', 48.0408),
    minLat: readNumber('ROUTE_MIN_LAT', 46.31),
    minLon: readNumber('ROUTE_MIN_LON', 47.97),
    maxLat: readNumber('ROUTE_MAX_LAT', 46.39),
    maxLon: readNumber('ROUTE_MAX_LON', 48.12),
    minSpeedKmh,
    maxSpeedKmh,
    initialFuelLevel: readNumber('INITIAL_FUEL_LEVEL', 80),
    routeSeed: readNumber('ROUTE_SEED', Date.now() % 10_000),
    speedingChance: readNumber('SPEEDING_CHANCE', 0.08),
    destinationRefreshMeters: readNumber('DESTINATION_REFRESH_METERS', 140),
    source: Bun.env.TELEMETRY_SOURCE?.trim() || 'fake-car-bun',
  };
}
