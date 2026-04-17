import { Injectable } from '@nestjs/common';
import {
  CreateTripInput,
  TripEntity,
  UpdateTripInput,
} from '../../../../shared/types/repository.types';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TripRepository } from '../trip.repository';

@Injectable()
export class TripPrismaRepository implements TripRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<TripEntity | null> {
    const trip = await this.prisma.trip.findUnique({ where: { id } });
    if (!trip) {
      return null;
    }
    return this.toTripEntity(trip);
  }

  async findByDriverId(driverId: number): Promise<TripEntity[]> {
    const trips = await this.prisma.trip.findMany({
      where: { userId: driverId },
      orderBy: { id: 'asc' },
    });
    return trips.map((trip) => this.toTripEntity(trip));
  }

  async create(data: CreateTripInput): Promise<TripEntity> {
    const tariff = await this.ensureTariffId();
    const created = await this.prisma.trip.create({
      data: {
        userId: data.driverId,
        carId: data.vehicleId,
        tariffId: tariff.id,
        startTime: data.startTime,
        endTime: data.endTime ?? null,
        distance: 0,
        duration: 0,
        status: data.status,
      },
    });
    return this.toTripEntity(created);
  }

  async update(id: number, data: UpdateTripInput): Promise<TripEntity> {
    const updated = await this.prisma.trip.update({
      where: { id },
      data: {
        userId: data.driverId ?? undefined,
        carId: data.vehicleId ?? undefined,
        startTime: data.startTime ?? undefined,
        endTime: data.endTime ?? undefined,
        status: data.status ?? undefined,
      },
    });
    return this.toTripEntity(updated);
  }

  private toTripEntity(trip: {
    id: number;
    userId: number;
    carId: number;
    status: string;
    startTime: Date;
    endTime: Date | null;
  }): TripEntity {
    return {
      id: trip.id,
      driverId: trip.userId,
      vehicleId: trip.carId,
      status:
        trip.status === 'FINISHED' || trip.status === 'CANCELLED'
          ? trip.status
          : 'ACTIVE',
      startTime: trip.startTime,
      endTime: trip.endTime,
      startLocation: { lat: 0, lon: 0 },
      endLocation: null,
    };
  }

  private async ensureTariffId() {
    const existing = await this.prisma.tariff.findFirst({
      where: { isDeleted: false },
    });
    if (existing) {
      return existing;
    }
    const zone = await this.prisma.geoZone.findFirst();
    if (zone) {
      return this.prisma.tariff.create({
        data: {
          name: 'Default tariff',
          pricePerMinute: 1,
          pricePerKm: 1,
          geoZoneId: zone.id,
          isDeleted: false,
        },
      });
    }
    const [zoneRow] = await this.prisma.$queryRaw<Array<{ id: number }>>`
      INSERT INTO geo_zone (name, type, polygon)
      VALUES ('Default zone', 'ALLOWED', ST_GeomFromText('POLYGON((0 0, 1 0, 1 1, 0 0))', 4326))
      RETURNING id
    `;
    return this.prisma.tariff.create({
      data: {
        name: 'Default tariff',
        pricePerMinute: 1,
        pricePerKm: 1,
        geoZoneId: zoneRow.id,
        isDeleted: false,
      },
    });
  }
}
