import type { Prisma, Telemetry } from '@prisma/client';

import { TelemetryEntity } from '../entities/telemetry.entity';
import { TelemetryRead } from '../entities/dto/telemetry.read';

function decimalToNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

export class TelemetryMapper {
  static fromDbToEntity(row: Telemetry): TelemetryEntity {
    return new TelemetryEntity(
      row.id,
      row.timestamp,
      decimalToNumber(row.lat),
      decimalToNumber(row.lon),
      row.speed,
      row.acceleration,
      row.fuelLevel,
      row.tripId,
    );
  }

  static fromEntityToRead(entity: TelemetryEntity): TelemetryRead {
    const read = new TelemetryRead();
    read.id = entity.id;
    read.timestamp = entity.timestamp.toISOString();
    read.lat = entity.lat;
    read.lon = entity.lon;
    read.speed = entity.speed;
    read.acceleration = entity.acceleration;
    read.fuelLevel = entity.fuelLevel;
    read.tripId = entity.tripId;
    return read;
  }
}

