import type { TelemetryConfig } from './config';
import {
  centerOfBounds,
  clampPositionToBounds,
  distanceMeters,
  isInsideBounds,
  randomPositionInBounds,
  type Position,
  type RouteBounds,
} from './geo';

export type Route = {
  points: Position[];
  distanceMeters: number;
  durationSeconds: number;
  source: 'osrm' | 'fallback';
};

export interface RouteProvider {
  normalizeStart(position: Position): Promise<Position>;
  buildRoute(from: Position): Promise<Route>;
}

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      type: 'LineString';
      coordinates: Array<[number, number]>;
    };
  }>;
};

type OsrmNearestResponse = {
  code: string;
  waypoints?: Array<{
    distance: number;
    location: [number, number];
  }>;
};

function boundsFromConfig(config: TelemetryConfig): RouteBounds {
  return {
    minLat: config.minLat,
    minLon: config.minLon,
    maxLat: config.maxLat,
    maxLon: config.maxLon,
  };
}

export class OsrmRouteProvider implements RouteProvider {
  private readonly bounds: RouteBounds;
  private readonly maxSnapDistanceMeters = 2_500;

  constructor(private readonly config: TelemetryConfig) {
    this.bounds = boundsFromConfig(config);
  }

  async normalizeStart(position: Position): Promise<Position> {
    const bounded = isInsideBounds(position, this.bounds) ? position : centerOfBounds(this.bounds);
    return this.nearestRoad(bounded);
  }

  async buildRoute(from: Position): Promise<Route> {
    if (!this.config.routingUrl) {
      throw new Error('ROUTING_URL is not configured');
    }

    const start = await this.nearestRoad(from);
    let lastError: unknown;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const candidate = randomPositionInBounds(this.bounds, this.config.routeSeed + attempt);
        const destination = await this.nearestRoad(candidate);
        const route = await this.requestRoute(start, destination);
        if (route.distanceMeters >= 250) {
          return route;
        }
        lastError = new Error('OSRM route is too short');
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('OSRM route was not found');
  }

  private async requestRoute(from: Position, to: Position): Promise<Route> {
    if (!this.config.routingUrl) {
      throw new Error('ROUTING_URL is not configured');
    }

    const coordinates = `${from.lon},${from.lat};${to.lon},${to.lat}`;
    const url =
      `${this.config.routingUrl}/route/v1/${this.config.routingProfile}/${coordinates}` +
      '?overview=full&geometries=geojson&steps=false&alternatives=false';

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM route failed: ${response.status}`);
    }

    const body = (await response.json()) as OsrmRouteResponse;
    const route = body.routes?.[0];
    if (body.code !== 'Ok' || !route || route.geometry.coordinates.length < 2) {
      throw new Error(`OSRM route not found: ${body.code}`);
    }

    return {
      points: route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      source: 'osrm',
    };
  }

  private async nearestRoad(position: Position): Promise<Position> {
    if (!this.config.routingUrl) {
      throw new Error('ROUTING_URL is not configured');
    }

    const url =
      `${this.config.routingUrl}/nearest/v1/${this.config.routingProfile}/${position.lon},${position.lat}` +
      `?number=1&radiuses=${this.maxSnapDistanceMeters}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM nearest failed: ${response.status}`);
    }

    const body = (await response.json()) as OsrmNearestResponse;
    const waypoint = body.waypoints?.[0];
    if (body.code !== 'Ok' || !waypoint) {
      throw new Error(`OSRM nearest not found: ${body.code}`);
    }
    if (waypoint.distance > this.maxSnapDistanceMeters) {
      throw new Error(`OSRM nearest is too far: ${waypoint.distance.toFixed(0)}m`);
    }

    const [lon, lat] = waypoint.location;
    return { lat, lon };
  }
}

export class FallbackRouteProvider implements RouteProvider {
  private readonly bounds: RouteBounds;

  constructor(config: TelemetryConfig) {
    this.bounds = boundsFromConfig(config);
  }

  async normalizeStart(position: Position): Promise<Position> {
    return isInsideBounds(position, this.bounds) ? position : centerOfBounds(this.bounds);
  }

  async buildRoute(from: Position): Promise<Route> {
    const points = [clampPositionToBounds(from, this.bounds)];
    for (let index = 0; index < 5; index += 1) {
      points.push(randomPositionInBounds(this.bounds, index));
    }

    const distance = points
      .slice(1)
      .reduce((sum, point, index) => sum + distanceMeters(points[index], point), 0);

    return {
      points,
      distanceMeters: distance,
      durationSeconds: Math.max(60, distance / 8),
      source: 'fallback',
    };
  }
}

export class ResilientRouteProvider implements RouteProvider {
  constructor(
    private readonly primary: RouteProvider,
    private readonly fallback: RouteProvider,
  ) {}

  async normalizeStart(position: Position): Promise<Position> {
    try {
      return await this.primary.normalizeStart(position);
    } catch (error) {
      console.warn(`[telemetry] start normalization fallback: ${String(error)}`);
      return this.fallback.normalizeStart(position);
    }
  }

  async buildRoute(from: Position): Promise<Route> {
    try {
      return await this.primary.buildRoute(from);
    } catch (error) {
      console.warn(`[telemetry] routing fallback: ${String(error)}`);
      return this.fallback.buildRoute(from);
    }
  }
}
