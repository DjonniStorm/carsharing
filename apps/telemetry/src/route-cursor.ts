import { bearingDeg, distanceMeters, interpolatePosition, type Position } from './geo';
import type { Route } from './route-provider';

export type RouteProgress = {
  position: Position;
  headingDeg: number;
  remainingMeters: number;
};

export class RouteCursor {
  private segmentIndex = 0;
  private segmentOffsetMeters = 0;
  private remainingMetersValue: number;

  constructor(private readonly route: Route) {
    this.remainingMetersValue = route.distanceMeters;
  }

  get remainingMeters(): number {
    return this.remainingMetersValue;
  }

  advance(distanceToMoveMeters: number): RouteProgress {
    let distanceLeft = distanceToMoveMeters;

    while (distanceLeft > 0 && this.segmentIndex < this.route.points.length - 1) {
      const from = this.route.points[this.segmentIndex];
      const to = this.route.points[this.segmentIndex + 1];
      const segmentLength = Math.max(0.01, distanceMeters(from, to));
      const available = segmentLength - this.segmentOffsetMeters;

      if (distanceLeft < available) {
        this.segmentOffsetMeters += distanceLeft;
        this.remainingMetersValue = Math.max(0, this.remainingMetersValue - distanceLeft);
        distanceLeft = 0;
        break;
      }

      distanceLeft -= available;
      this.remainingMetersValue = Math.max(0, this.remainingMetersValue - available);
      this.segmentIndex += 1;
      this.segmentOffsetMeters = 0;
    }

    return this.current();
  }

  current(): RouteProgress {
    const from = this.route.points[this.segmentIndex];
    const to = this.route.points[Math.min(this.segmentIndex + 1, this.route.points.length - 1)];
    const segmentLength = Math.max(0.01, distanceMeters(from, to));
    const ratio = this.segmentOffsetMeters / segmentLength;

    return {
      position: interpolatePosition(from, to, ratio),
      headingDeg: bearingDeg(from, to),
      remainingMeters: this.remainingMetersValue,
    };
  }
}
