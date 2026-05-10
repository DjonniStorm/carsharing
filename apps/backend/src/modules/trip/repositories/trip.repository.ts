import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { TripMapper } from '../common/mapper';
import type {
  TripFindByIdOptions,
  TripListParams,
} from '../entities/trip-query.types';
import { TripStatus } from '../entities/trip.status';
import { TripEntity } from '../entities/trip.entity';
import type {
  ITripRepository,
  TripRepositoryCreateInput,
  TripRepositoryUpdatePatch,
} from './trip.repository.interface';
import type {
  TripHistoryFullSqlRow,
  TripHistorySqlRow,
} from '../common/trip-history.types';

@Injectable()
export class TripRepository implements ITripRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params?: TripListParams): Promise<TripEntity[]> {
    const listParams = params ?? {};
    const rows = await this.prisma.trip.findMany({
      where: {
        ...(listParams.userId ? { userId: listParams.userId } : {}),
        ...(listParams.carId ? { carId: listParams.carId } : {}),
        ...(listParams.geoZoneVersionId
          ? { geoZoneVersionId: listParams.geoZoneVersionId }
          : {}),
        ...(listParams.status !== undefined
          ? { status: listParams.status }
          : {}),
        ...(listParams.startedAfter || listParams.startedBefore
          ? {
              startedAt: {
                ...(listParams.startedAfter
                  ? { gte: listParams.startedAfter }
                  : {}),
                ...(listParams.startedBefore
                  ? { lte: listParams.startedBefore }
                  : {}),
              },
            }
          : {}),
      },
      orderBy: { startedAt: 'desc' },
    });
    return rows.map(TripMapper.fromDbToEntity);
  }

  async findById(
    id: string,
    options?: TripFindByIdOptions,
  ): Promise<TripEntity | null> {
    const include: Prisma.TripInclude = {
      ...(options?.withUser ? { user: true } : {}),
      ...(options?.withCar ? { car: true } : {}),
      ...(options?.withGeoZoneVersion ? { geoZoneVersion: true } : {}),
    };
    const row = await this.prisma.trip.findUnique({
      where: { id },
      ...(Object.keys(include).length > 0 ? { include } : {}),
    });
    if (!row) {
      return null;
    }
    return TripMapper.fromDbToEntity(row);
  }

  async create(input: TripRepositoryCreateInput): Promise<TripEntity> {
    const row = await this.prisma.trip.create({
      data: {
        userId: input.userId,
        carId: input.carId,
        geoZoneVersionId: input.geoZoneVersionId,
        status: input.status ?? TripStatus.PENDING,
        startedAt: input.startedAt ?? new Date(),
        distance: input.distance ?? 0,
        duration: input.duration ?? 0,
        startLat: input.startLat ?? undefined,
        startLng: input.startLng ?? undefined,
        carPlateSnapshot: input.carPlateSnapshot ?? undefined,
        carDisplayNameSnapshot: input.carDisplayNameSnapshot ?? undefined,
      },
    });
    return TripMapper.fromDbToEntity(row);
  }

  async update(
    id: string,
    patch: TripRepositoryUpdatePatch,
  ): Promise<TripEntity> {
    const data: Prisma.TripUncheckedUpdateInput = {};
    if (patch.status !== undefined) {
      data.status = patch.status;
    }
    if (patch.finishedAt !== undefined) {
      data.finishedAt = patch.finishedAt;
    }
    if (patch.pauseStartedAt !== undefined) {
      data.pauseStartedAt = patch.pauseStartedAt;
    }
    if (patch.totalPausedSec !== undefined) {
      data.totalPausedSec = patch.totalPausedSec;
    }
    if (patch.startLat !== undefined) {
      data.startLat = patch.startLat;
    }
    if (patch.startLng !== undefined) {
      data.startLng = patch.startLng;
    }
    if (patch.finishLat !== undefined) {
      data.finishLat = patch.finishLat;
    }
    if (patch.finishLng !== undefined) {
      data.finishLng = patch.finishLng;
    }
    if (patch.distance !== undefined) {
      data.distance = patch.distance;
    }
    if (patch.duration !== undefined) {
      data.duration = patch.duration;
    }
    if (patch.distanceMeters !== undefined) {
      data.distanceMeters = patch.distanceMeters;
    }
    if (patch.chargedMinutes !== undefined) {
      data.chargedMinutes = patch.chargedMinutes;
    }
    if (patch.chargedKm !== undefined) {
      data.chargedKm = patch.chargedKm;
    }
    if (patch.priceTime !== undefined) {
      data.priceTime = patch.priceTime;
    }
    if (patch.priceDistance !== undefined) {
      data.priceDistance = patch.priceDistance;
    }
    if (patch.pricePause !== undefined) {
      data.pricePause = patch.pricePause;
    }
    if (patch.priceTotal !== undefined) {
      data.priceTotal = patch.priceTotal;
    }
    if (patch.geoZoneVersionId !== undefined) {
      data.geoZoneVersionId = patch.geoZoneVersionId;
    }
    if (patch.carPlateSnapshot !== undefined) {
      data.carPlateSnapshot = patch.carPlateSnapshot;
    }
    if (patch.carDisplayNameSnapshot !== undefined) {
      data.carDisplayNameSnapshot = patch.carDisplayNameSnapshot;
    }
    const row = await this.prisma.trip.update({
      where: { id },
      data,
    });
    return TripMapper.fromDbToEntity(row);
  }

  async findHistoryShortByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<TripHistorySqlRow[]> {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    return this.queryTripHistoryRows(
      Prisma.sql`t.user_id = ${userId}::uuid`,
      Prisma.sql`LIMIT ${limit} OFFSET ${offset}`,
    );
  }

  async findHistoryShortByTripId(
    tripId: string,
  ): Promise<TripHistorySqlRow | null> {
    const rows = await this.queryTripHistoryRows(
      Prisma.sql`t.id = ${tripId}::uuid`,
      Prisma.sql`LIMIT 1`,
    );
    return rows[0] ?? null;
  }

  async findHistoryFullByTripId(
    tripId: string,
  ): Promise<TripHistoryFullSqlRow | null> {
    const rows = await this.queryTripHistoryFullRows(
      Prisma.sql`t.id = ${tripId}::uuid`,
    );
    return rows[0] ?? null;
  }

  private async queryTripHistoryRows(
    whereSql: Prisma.Sql,
    tailSql: Prisma.Sql,
  ): Promise<TripHistorySqlRow[]> {
    return this.prisma.$queryRaw<TripHistorySqlRow[]>(Prisma.sql`
      SELECT
        json_build_object(
          'id', t.id,
          'userId', t.user_id,
          'carId', t.car_id,
          'geoZoneVersionId', t.geo_zone_version_id,
          'status', t.status,
          'startedAt', t.start_time,
          'finishedAt', t.end_time,
          'pauseStartedAt', t.pause_started_at,
          'totalPausedSec', t.total_paused_sec,
          'startLat', t.start_lat,
          'startLng', t.start_lon,
          'finishLat', t.finish_lat,
          'finishLng', t.finish_lng,
          'distance', t.distance,
          'duration', t.duration,
          'distanceMeters', t.distance_meters,
          'chargedMinutes', t.charged_minutes,
          'chargedKm', t.charged_km,
          'priceTime', t.price_time,
          'priceDistance', t.price_distance,
          'pricePause', t.price_pause,
          'priceTotal', t.price_total,
          'createdAt', t.created_at,
          'updatedAt', t.updated_at,
          'carPlateSnapshot', t.car_plate_snapshot,
          'carDisplayNameSnapshot', t.car_display_name_snapshot
        ) AS trip_json,
        json_build_object(
          'id', c.id,
          'brand', c.brand,
          'model', c.model,
          'licensePlate', c.license_plate,
          'color', c.color,
          'mileage', c.mileage,
          'fuelLevel', c.fuel_level,
          'isAvailable', c.is_available,
          'carStatus', c.car_status_id,
          'isDeleted', c.is_deleted,
          'createdAt', c.created_at,
          'updatedAt', c.updated_at,
          'lastKnownLat', c.last_known_lat,
          'lastKnownLon', c.last_known_lon,
          'lastPositionAt', c.last_position_at
        ) AS car_json,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', v.id,
                'tripId', v.trip_id,
                'type', v.type,
                'description', v.description,
                'createdAt', v.created_at
              )
              ORDER BY v.created_at
            ),
            '[]'::json
          )
          FROM violation v
          WHERE v.trip_id = t.id
        ) AS violations_json
      FROM trip t
      INNER JOIN car c ON c.id = t.car_id
      WHERE ${whereSql}
      ORDER BY t.start_time DESC
      ${tailSql}
    `);
  }

  private async queryTripHistoryFullRows(
    whereSql: Prisma.Sql,
  ): Promise<TripHistoryFullSqlRow[]> {
    return this.prisma.$queryRaw<TripHistoryFullSqlRow[]>(Prisma.sql`
      SELECT
        json_build_object(
          'id', t.id,
          'userId', t.user_id,
          'carId', t.car_id,
          'geoZoneVersionId', t.geo_zone_version_id,
          'status', t.status,
          'startedAt', t.start_time,
          'finishedAt', t.end_time,
          'pauseStartedAt', t.pause_started_at,
          'totalPausedSec', t.total_paused_sec,
          'startLat', t.start_lat,
          'startLng', t.start_lon,
          'finishLat', t.finish_lat,
          'finishLng', t.finish_lng,
          'distance', t.distance,
          'duration', t.duration,
          'distanceMeters', t.distance_meters,
          'chargedMinutes', t.charged_minutes,
          'chargedKm', t.charged_km,
          'priceTime', t.price_time,
          'priceDistance', t.price_distance,
          'pricePause', t.price_pause,
          'priceTotal', t.price_total,
          'createdAt', t.created_at,
          'updatedAt', t.updated_at,
          'carPlateSnapshot', t.car_plate_snapshot,
          'carDisplayNameSnapshot', t.car_display_name_snapshot
        ) AS trip_json,
        json_build_object(
          'id', c.id,
          'brand', c.brand,
          'model', c.model,
          'licensePlate', c.license_plate,
          'color', c.color,
          'mileage', c.mileage,
          'fuelLevel', c.fuel_level,
          'isAvailable', c.is_available,
          'carStatus', c.car_status_id,
          'isDeleted', c.is_deleted,
          'createdAt', c.created_at,
          'updatedAt', c.updated_at,
          'lastKnownLat', c.last_known_lat,
          'lastKnownLon', c.last_known_lon,
          'lastPositionAt', c.last_position_at
        ) AS car_json,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', v.id,
                'tripId', v.trip_id,
                'type', v.type,
                'description', v.description,
                'createdAt', v.created_at
              )
              ORDER BY v.created_at
            ),
            '[]'::json
          )
          FROM violation v
          WHERE v.trip_id = t.id
        ) AS violations_json,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', tel.id,
                'timestamp', tel.timestamp,
                'lat', tel.lat,
                'lon', tel.lon,
                'speed', tel.speed,
                'acceleration', tel.acceleration,
                'fuelLevel', tel.fuel_level,
                'tripId', tel.trip_id
              )
              ORDER BY tel.timestamp
            ),
            '[]'::json
          )
          FROM telemetry tel
          WHERE tel.trip_id = t.id
        ) AS telemetry_json
      FROM trip t
      INNER JOIN car c ON c.id = t.car_id
      WHERE ${whereSql}
      ORDER BY t.start_time DESC
      LIMIT 1
    `);
  }
}
