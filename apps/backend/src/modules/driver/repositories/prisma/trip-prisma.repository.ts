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

  async findActiveByVehicleId(vehicleId: number): Promise<TripEntity | null> {
    const trip = await this.prisma.trip.findFirst({
      where: { carId: vehicleId, status: 'ACTIVE' },
      orderBy: { id: 'desc' },
    });
    return trip ? this.toTripEntity(trip) : null;
  }

  async create(data: CreateTripInput): Promise<TripEntity> {
    const tariff = await this.prisma.tariff.findFirst({
      where: {
        id: data.tariffId,
        isDeleted: false,
      },
    });
    if (!tariff) {
      throw new Error(`Tariff ${data.tariffId} not found`);
    }

    const created = await this.prisma.trip.create({
      data: {
        userId: data.driverId,
        carId: data.vehicleId,
        tariffId: data.tariffId,
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
        tariffId: data.tariffId ?? undefined,
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
    tariffId: number;
    status: string;
    startTime: Date;
    endTime: Date | null;
  }): TripEntity {
    return {
      id: trip.id,
      driverId: trip.userId,
      vehicleId: trip.carId,
      tariffId: trip.tariffId,
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
}
