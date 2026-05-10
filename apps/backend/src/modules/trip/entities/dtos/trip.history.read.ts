import { TripRead } from './trip.read';
import { CarRead } from 'src/modules/car/entities/dtos/car.read';
import { TelemetryRead } from 'src/modules/telemetry/entities/dto/telemetry.read';
import { ViolationRead } from 'src/modules/violation/entities/dtos/violation.read';

export class TripHistoryRead {
  trip: TripRead;
  points: TelemetryRead[];
  car: CarRead;
  violations: ViolationRead[];
}

export class TripHistoryShortInfoRead {
  trip: TripRead;
  car: CarRead;
  violations: ViolationRead[];
}
