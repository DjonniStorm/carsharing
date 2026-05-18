import { TelemetryRead } from 'src/modules/telemetry/entities/dto/telemetry.read';
import { CarRead } from 'src/modules/car/entities/dtos/car.read';
import { CarStatus } from 'src/modules/car/entities/car-status';
import { ViolationRead } from 'src/modules/violation/entities/dtos/violation.read';
import { ViolationStatus } from 'src/modules/violation/entities/violation.status';
import { TripRead } from '../entities/dtos/trip.read';
import { TripStatus } from '../entities/trip.status';
import {
  TripHistoryRead,
  TripHistoryShortInfoRead,
} from '../entities/dtos/trip.history.read';
import type {
  TripHistoryFullSqlRow,
  TripHistorySqlRow,
} from './trip-history.types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date(NaN);
}

function parseDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  const d = parseDate(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function num(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export class TripHistoryMapper {
  static shortInfoFromSqlRow(row: TripHistorySqlRow): TripHistoryShortInfoRead {
    const dto = new TripHistoryShortInfoRead();
    dto.trip = TripHistoryMapper.tripReadFromJson(row.trip_json);
    dto.car = TripHistoryMapper.carReadFromJson(row.car_json);
    dto.violations = TripHistoryMapper.violationsReadFromJson(
      row.violations_json,
    );
    return dto;
  }

  static fullInfoFromSqlRow(row: TripHistoryFullSqlRow): TripHistoryRead {
    const short = TripHistoryMapper.shortInfoFromSqlRow(row);
    const points = TripHistoryMapper.telemetryReadsFromJson(row.telemetry_json);
    return TripHistoryMapper.toTripHistoryRead(short, points);
  }

  static tripReadFromJson(raw: unknown): TripRead {
    const o = asRecord(raw);
    if (!o) {
      throw new Error('trip_json: expected object');
    }
    const read = new TripRead();
    read.id = String(o.id ?? '');
    read.userId = String(o.userId ?? '');
    read.carId = String(o.carId ?? '');
    read.geoZoneVersionId = String(o.geoZoneVersionId ?? '');
    read.status = Number(o.status) as TripStatus;
    read.startedAt = parseDate(o.startedAt);
    read.finishedAt = parseDateOrNull(o.finishedAt);
    read.pauseStartedAt = parseDateOrNull(o.pauseStartedAt);
    read.totalPausedSec = Number(o.totalPausedSec ?? 0);
    read.startLat = num(o.startLat);
    read.startLng = num(o.startLng);
    read.finishLat = num(o.finishLat);
    read.finishLng = num(o.finishLng);
    read.distance = Number(o.distance ?? 0);
    read.duration = Number(o.duration ?? 0);
    read.distanceMeters =
      o.distanceMeters === null || o.distanceMeters === undefined
        ? null
        : Number(o.distanceMeters);
    read.chargedMinutes = num(o.chargedMinutes);
    read.chargedKm = num(o.chargedKm);
    read.priceTime = num(o.priceTime);
    read.priceDistance = num(o.priceDistance);
    read.pricePause = num(o.pricePause);
    read.priceTotal = num(o.priceTotal);
    read.createdAt = parseDate(o.createdAt);
    read.updatedAt = parseDate(o.updatedAt);
    read.carPlateSnapshot =
      o.carPlateSnapshot === null || o.carPlateSnapshot === undefined
        ? null
        : String(o.carPlateSnapshot);
    read.carDisplayNameSnapshot =
      o.carDisplayNameSnapshot === null ||
      o.carDisplayNameSnapshot === undefined
        ? null
        : String(o.carDisplayNameSnapshot);
    return read;
  }

  static carReadFromJson(raw: unknown): CarRead {
    const o = asRecord(raw);
    if (!o) {
      throw new Error('car_json: expected object');
    }
    const read = new CarRead();
    read.id = String(o.id ?? '');
    read.brand = String(o.brand ?? '');
    read.model = String(o.model ?? '');
    read.licensePlate = String(o.licensePlate ?? '');
    read.color = String(o.color ?? '');
    read.mileage = Number(o.mileage ?? 0);
    read.fuelLevel = Number(o.fuelLevel ?? 0);
    read.isAvailable = Boolean(o.isAvailable);
    read.carStatus = Number(o.carStatus) as CarStatus;
    read.isDeleted = Boolean(o.isDeleted);
    read.createdAt = parseDate(o.createdAt);
    read.updatedAt = parseDateOrNull(o.updatedAt);
    read.lastKnownLat = num(o.lastKnownLat);
    read.lastKnownLon = num(o.lastKnownLon);
    read.lastPositionAt = parseDateOrNull(o.lastPositionAt);
    return read;
  }

  static telemetryReadsFromJson(raw: unknown): TelemetryRead[] {
    if (raw === null || raw === undefined) {
      return [];
    }
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map((item) => {
      const o = asRecord(item);
      if (!o) {
        throw new Error('telemetry item: expected object');
      }
      const p = new TelemetryRead();
      p.id = String(o.id ?? '');
      p.tripId = String(o.tripId ?? '');
      p.timestamp = parseDate(o.timestamp).toISOString();
      p.lat = num(o.lat) ?? 0;
      p.lon = num(o.lon) ?? 0;
      p.speed = Number(o.speed ?? 0);
      p.acceleration = Number(o.acceleration ?? 0);
      p.fuelLevel = Number(o.fuelLevel ?? 0);
      return p;
    });
  }

  static violationsReadFromJson(raw: unknown): ViolationRead[] {
    if (raw === null || raw === undefined) {
      return [];
    }
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map((item) => {
      const o = asRecord(item);
      if (!o) {
        throw new Error('violation item: expected object');
      }
      const v = new ViolationRead();
      v.id = String(o.id ?? '');
      v.tripId = String(o.tripId ?? '');
      v.type = Number(o.type) as ViolationStatus;
      v.description = String(o.description ?? '');
      v.createdAt = parseDate(o.createdAt);
      return v;
    });
  }

  static toTripHistoryRead(
    short: TripHistoryShortInfoRead,
    points: TelemetryRead[],
  ): TripHistoryRead {
    const full = new TripHistoryRead();
    full.trip = short.trip;
    full.car = short.car;
    full.violations = short.violations;
    full.points = points;
    return full;
  }
}
