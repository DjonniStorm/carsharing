import { BackendClient, type Trip } from './backend-client';
import type { TelemetryConfig } from './config';
import { DrivingModel } from './driving-model';
import type { Position } from './geo';
import { RouteCursor } from './route-cursor';
import type { Route, RouteProvider } from './route-provider';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class TelemetrySimulator {
  private position: Position;
  private fuelLevel: number;
  private lastTripPollAt = 0;
  private activeTrip: Trip | null = null;
  private route: Route | null = null;
  private routeCursor: RouteCursor | null = null;
  private readonly drivingModel: DrivingModel;

  constructor(
    private readonly config: TelemetryConfig,
    private readonly client: BackendClient,
    private readonly routeProvider: RouteProvider,
  ) {
    this.position = {
      lat: config.initialLat,
      lon: config.initialLon,
    };
    this.fuelLevel = config.initialFuelLevel;
    this.drivingModel = new DrivingModel(config);
  }

  async start(): Promise<void> {
    await this.seedPositionFromCar();

    console.log(
      `[telemetry] car=${this.config.carId} idle=${this.config.idleIntervalMs / 1000}s active=${this.config.activeIntervalMs / 1000}s`,
    );

    while (true) {
      try {
        const trip = await this.getActiveTrip();
        if (trip) {
          await this.tickActive(trip);
          await sleep(this.config.activeIntervalMs);
        } else {
          await this.tickIdle();
          await sleep(this.config.idleIntervalMs);
        }
      } catch (error) {
        console.error(`[telemetry] tick failed: ${String(error)}`);
        await sleep(this.config.pollIntervalMs);
      }
    }
  }

  private async seedPositionFromCar(): Promise<void> {
    const car = await this.client.getCar();
    this.fuelLevel = car.fuelLevel;
    if (car.lastKnownLat != null && car.lastKnownLon != null) {
      this.position = {
        lat: car.lastKnownLat,
        lon: car.lastKnownLon,
      };
    }
    this.position = await this.routeProvider.normalizeStart(this.position);
  }

  private async getActiveTrip(): Promise<Trip | null> {
    const now = Date.now();
    if (this.activeTrip && now - this.lastTripPollAt < this.config.pollIntervalMs) {
      return this.activeTrip;
    }

    this.lastTripPollAt = now;
    this.activeTrip = await this.client.findActiveTrip();
    return this.activeTrip;
  }

  private async tickIdle(): Promise<void> {
    this.drivingModel.stop();
    this.route = null;
    this.routeCursor = null;

    await this.client.updateCarPosition(this.position.lat, this.position.lon, new Date());
    console.log(
      `[telemetry] idle position lat=${this.position.lat.toFixed(6)} lon=${this.position.lon.toFixed(6)}`,
    );
  }

  private async tickActive(trip: Trip): Promise<void> {
    const seconds = this.config.activeIntervalMs / 1000;
    await this.ensureRoute();

    if (!this.route || !this.routeCursor) {
      throw new Error('route cursor was not initialized');
    }

    const drive = this.drivingModel.next(this.route, this.routeCursor.remainingMeters, seconds);
    const progress = this.routeCursor.advance(drive.distanceMeters);

    this.position = progress.position;
    this.fuelLevel = Math.max(
      0,
      this.fuelLevel - drive.distanceMeters * (drive.isSpeeding ? 0.0021 : 0.0015),
    );

    await this.client.sendTelemetry({
      timestamp: new Date().toISOString(),
      lat: Number(this.position.lat.toFixed(6)),
      lon: Number(this.position.lon.toFixed(6)),
      speed: Number(drive.speedKmh.toFixed(2)),
      acceleration: Number(drive.acceleration.toFixed(3)),
      fuelLevel: Number(this.fuelLevel.toFixed(2)),
      source: this.config.source,
    });

    console.log(
      `[telemetry] active trip=${trip.id} route=${this.route.source} speed=${drive.speedKmh.toFixed(1)} heading=${progress.headingDeg.toFixed(0)} fuel=${this.fuelLevel.toFixed(1)}`,
    );

    if (progress.remainingMeters <= this.config.destinationRefreshMeters) {
      this.route = null;
      this.routeCursor = null;
    }
  }

  private async ensureRoute(): Promise<void> {
    if (this.route && this.routeCursor) {
      return;
    }

    this.route = await this.routeProvider.buildRoute(this.position);
    this.routeCursor = new RouteCursor(this.route);
    console.log(
      `[telemetry] route ready source=${this.route.source} distance=${this.route.distanceMeters.toFixed(0)}m`,
    );
  }
}
