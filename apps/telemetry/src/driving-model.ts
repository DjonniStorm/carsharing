import type { TelemetryConfig } from './config';
import { randomBetween } from './geo';
import type { Route } from './route-provider';

export type DrivingTick = {
  speedKmh: number;
  acceleration: number;
  distanceMeters: number;
  isSpeeding: boolean;
};

export class DrivingModel {
  private currentSpeedKmh = 0;

  constructor(private readonly config: TelemetryConfig) {}

  next(route: Route, remainingMeters: number, dtSeconds: number): DrivingTick {
    const routeSpeedKmh = (route.distanceMeters / Math.max(1, route.durationSeconds)) * 3.6;
    const localLimit = Math.max(
      this.config.minSpeedKmh,
      Math.min(this.config.maxSpeedKmh, routeSpeedKmh || this.config.maxSpeedKmh),
    );
    const nearEndFactor = remainingMeters < 220 ? Math.max(0.25, remainingMeters / 220) : 1;
    const isSpeeding = Math.random() < this.config.speedingChance;
    const targetSpeed = localLimit * nearEndFactor * randomBetween(0.75, isSpeeding ? 1.24 : 1.02);
    const nextSpeed = this.currentSpeedKmh + (targetSpeed - this.currentSpeedKmh) * 0.42;
    const acceleration = ((nextSpeed - this.currentSpeedKmh) * 1000) / 3600 / dtSeconds;

    this.currentSpeedKmh = Math.max(0, nextSpeed);

    return {
      speedKmh: this.currentSpeedKmh,
      acceleration,
      distanceMeters: (this.currentSpeedKmh * 1000 * dtSeconds) / 3600,
      isSpeeding,
    };
  }

  stop(): void {
    this.currentSpeedKmh = 0;
  }
}
