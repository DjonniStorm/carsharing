import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

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

@Injectable()
export class TripRepository implements ITripRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params?: TripListParams): Promise<TripEntity[]> {
    const listParams = params ?? {};
    const rows = await this.prisma.trip.findMany({
      where: {
        ...(listParams.userId ? { userId: listParams.userId } : {}),
        ...(listParams.carId ? { carId: listParams.carId } : {}),
        ...(listParams.tariffVersionId
          ? { tariffVersionId: listParams.tariffVersionId }
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
    id: number,
    options?: TripFindByIdOptions,
  ): Promise<TripEntity | null> {
    const include: Prisma.TripInclude = {
      ...(options?.withUser ? { user: true } : {}),
      ...(options?.withCar ? { car: true } : {}),
      ...(options?.withTariffVersion ? { tariffVersion: true } : {}),
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
        tariffVersionId: input.tariffVersionId,
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
    id: number,
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
    if (patch.tariffVersionId !== undefined) {
      data.tariffVersionId = patch.tariffVersionId;
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
}
