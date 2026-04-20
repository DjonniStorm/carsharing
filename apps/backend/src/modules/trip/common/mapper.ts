import type { Prisma } from '@prisma/client';
import type { Trip } from '@prisma/client';

import { TripEntity } from '../entities/trip.entity';
import { TripRead } from '../entities/dtos/trip.read';
import { TripStatus } from '../entities/trip.status';

function decimalToNumber(
  value: Prisma.Decimal | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toNumber();
}

export class TripMapper {
  static fromDbToEntity(row: Trip): TripEntity {
    return new TripEntity(
      String(row.id),
      row.userId,
      row.carId,
      row.tariffVersionId,
      row.status as TripStatus,
      row.startedAt,
      row.finishedAt,
      row.pauseStartedAt,
      row.totalPausedSec,
      decimalToNumber(row.startLat),
      decimalToNumber(row.startLng),
      decimalToNumber(row.finishLat),
      decimalToNumber(row.finishLng),
      row.distance,
      row.duration,
      row.distanceMeters,
      row.chargedMinutes ?? null,
      row.chargedKm ?? null,
      decimalToNumber(row.priceTime),
      decimalToNumber(row.priceDistance),
      decimalToNumber(row.pricePause),
      decimalToNumber(row.priceTotal),
      row.createdAt,
      row.updatedAt,
      row.carPlateSnapshot,
      row.carDisplayNameSnapshot,
    );
  }

  static fromEntityToRead(entity: TripEntity): TripRead {
    const read = new TripRead();
    read.id = Number(entity.id);
    read.userId = entity.userId;
    read.carId = entity.carId;
    read.tariffVersionId = entity.tariffVersionId;
    read.status = entity.status;
    read.startedAt = entity.startedAt;
    read.finishedAt = entity.finishedAt;
    read.pauseStartedAt = entity.pauseStartedAt;
    read.totalPausedSec = entity.totalPausedSec;
    read.startLat = entity.startLat;
    read.startLng = entity.startLng;
    read.finishLat = entity.finishLat;
    read.finishLng = entity.finishLng;
    read.distance = entity.distance;
    read.duration = entity.duration;
    read.distanceMeters = entity.distanceMeters;
    read.chargedMinutes = entity.chargedMinutes;
    read.chargedKm = entity.chargedKm;
    read.priceTime = entity.priceTime;
    read.priceDistance = entity.priceDistance;
    read.pricePause = entity.pricePause;
    read.priceTotal = entity.priceTotal;
    read.createdAt = entity.createdAt;
    read.updatedAt = entity.updatedAt;
    read.carPlateSnapshot = entity.carPlateSnapshot;
    read.carDisplayNameSnapshot = entity.carDisplayNameSnapshot;
    return read;
  }
}
