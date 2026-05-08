import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { TelemetryMapper } from '../common/mapper';
import { TelemetryCreate } from '../entities/dto/telemetry.create';
import { TelemetryEntity } from '../entities/telemetry.entity';
import { ITelemetryRepository } from './telemetry.repository.interface';

@Injectable()
export class TelemetryRepository implements ITelemetryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: TelemetryCreate): Promise<TelemetryEntity> {
    const row = await this.prisma.telemetry.create({
      data: {
        timestamp: new Date(input.timestamp),
        lat: input.lat,
        lon: input.lon,
        speed: input.speed,
        acceleration: input.acceleration,
        fuelLevel: input.fuelLevel,
        tripId: input.tripId,
      },
    });
    return TelemetryMapper.fromDbToEntity(row);
  }

  async findManyByTripId(
    tripId: string,
    timeFrom?: Date,
    timeTo?: Date,
    limit?: number,
    offset?: number,
    sort?: 'asc' | 'desc',
  ): Promise<TelemetryEntity[]> {
    const rows = await this.prisma.telemetry.findMany({
      where: {
        tripId,
        ...(timeFrom || timeTo
          ? {
              timestamp: {
                ...(timeFrom ? { gte: timeFrom } : {}),
                ...(timeTo ? { lte: timeTo } : {}),
              },
            }
          : {}),
      },
      orderBy: { timestamp: sort ?? 'asc' },
      ...(limit !== undefined ? { take: limit } : {}),
      ...(offset !== undefined ? { skip: offset } : {}),
    });
    return rows.map(TelemetryMapper.fromDbToEntity);
  }

  async findById(id: string): Promise<TelemetryEntity | null> {
    const row = await this.prisma.telemetry.findUnique({
      where: { id },
    });
    return row ? TelemetryMapper.fromDbToEntity(row) : null;
  }
}
