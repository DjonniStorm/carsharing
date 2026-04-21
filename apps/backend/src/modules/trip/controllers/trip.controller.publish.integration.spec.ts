import { BadRequestException, Injectable } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import type { TripRead } from '../entities/dtos/trip.read';
import { GeozoneRepository } from '../../geozone/repositories/geozone.repository';
import type {
  GeoJSONMultiPolygon,
  GeoJSONPosition,
} from '../../geozone/entities/geozone.geometry';
import { GeozoneType } from '../../geozone/entities/geozone.type';
import { CarStatus } from '../../car/entities/car-status';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { ITripRepositoryToken } from '../repositories/trip.repository.interface';
import { TripRepository } from '../repositories/trip.repository';
import {
  ITripRealtimePublisherToken,
  type ITripRealtimePublisher,
} from '../services/trip-realtime.publisher.interface';
import { TripService } from '../services/trip.service';
import { TripCreate } from '../entities/dtos/trip.create';
import { TripPublishFailedException } from '../common/errors';
import { TripController } from './trip.controller';

@Injectable()
class FailingTripRealtimePublisher implements ITripRealtimePublisher {
  async publishTripStarted(trip: TripRead): Promise<void> {
    throw new TripPublishFailedException(`publish failed for trip ${trip.id}`);
  }
}

describe('TripController: ошибки публикации (интеграция через DI)', () => {
  let prisma: PrismaService;
  let moduleRef: TestingModule;
  let controller: TripController;
  let userId: string;
  let carId: string;
  let tariffVersionId: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');

    const suffix = uuidv4().replace(/-/g, '');
    const user = await prisma.user.create({
      data: {
        name: `Trip pub int ${suffix.slice(0, 10)}`,
        email: `trip-pub-int-${suffix}@test.local`,
        phone: `+79${suffix.replace(/[a-f]/gi, '5').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    userId = user.id;

    const car = await prisma.car.create({
      data: {
        brand: 'Trip',
        model: 'Publish',
        licensePlate: `PI${suffix.slice(0, 8)}`,
        color: 'black',
        mileage: 3_000,
        fuelLevel: 60,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
    });
    carId = car.id;

    const geozoneRepository = new GeozoneRepository(prisma);
    const zone = await geozoneRepository.createWithInitialVersion({
      name: 'Trip publish integration zone',
      type: GeozoneType.RENTAL,
      color: '#333333',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(0),
      rules: null,
      pricePerMinute: 1,
      pricePerKm: 2,
      pausePricePerMinute: 0.5,
    });
    if (!zone.currentVersionId) {
      throw new Error('currentVersionId expected');
    }
    tariffVersionId = zone.currentVersionId;

    moduleRef = await Test.createTestingModule({
      controllers: [TripController],
      providers: [
        TripService,
        { provide: PrismaService, useValue: prisma },
        { provide: ITripRepositoryToken, useClass: TripRepository },
        {
          provide: ITripRealtimePublisherToken,
          useClass: FailingTripRealtimePublisher,
        },
      ],
    }).compile();

    controller = moduleRef.get(TripController);
  });

  afterEach(async () => {
    await moduleRef.close();
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('возвращает BadRequest, если realtime-публикация падает в реальном DI-графе', async () => {
    const dto = new TripCreate();
    dto.userId = userId;
    dto.carId = carId;
    dto.tariffVersionId = tariffVersionId;

    await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('пробрасывает сообщение об ошибке публикации через маппинг контроллера', async () => {
    const dto = new TripCreate();
    dto.userId = userId;
    dto.carId = carId;
    dto.tariffVersionId = tariffVersionId;

    await expect(controller.create(dto)).rejects.toMatchObject({
      message: expect.stringContaining('publish failed for trip'),
    });
  });
});

const sampleMultiPolygon = (seed: number): GeoJSONMultiPolygon => {
  const baseLon = 35 + seed * 0.01;
  const ring: GeoJSONPosition[] = [
    [baseLon, 55.7],
    [baseLon + 0.15, 55.7],
    [baseLon + 0.15, 55.85],
    [baseLon, 55.85],
    [baseLon, 55.7],
  ];
  return {
    type: 'MultiPolygon',
    coordinates: [[ring]] as unknown as GeoJSONMultiPolygon['coordinates'],
  };
};

