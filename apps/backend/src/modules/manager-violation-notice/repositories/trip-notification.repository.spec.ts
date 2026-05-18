import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import { GeozoneRepository } from '../../geozone/repositories/geozone.repository';
import type {
  GeoJSONMultiPolygon,
  GeoJSONPosition,
} from '../../geozone/entities/geozone.geometry';
import { GeozoneType } from '../../geozone/entities/geozone.type';
import { CarStatus } from '../../car/entities/car-status';
import { TripStatus } from '../../trip/entities/trip.status';
import { ViolationStatus } from '../../violation/entities/violation.status';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { TripRepository } from '../../trip/repositories/trip.repository';
import { ManagerNoticeDeliveryStatus } from '../entities/notification-delivery.status';
import { TripNotificationRepository } from './trip-notification.repository';

describe('TripNotificationRepository', () => {
  let prisma: PrismaService;
  let repository: TripNotificationRepository;
  let tripRepository: TripRepository;
  let geozoneRepository: GeozoneRepository;
  let userId: string;
  let carId: string;
  let geoZoneVersionId: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateApplicationTable(prisma, 'violation_notification');
    await truncateApplicationTable(prisma, 'notification');
    await truncateApplicationTable(prisma, 'violation');
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff_preset');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');

    const suffix = uuidv4().replace(/-/g, '');
    const user = await prisma.user.create({
      data: {
        name: `Notif repo ${suffix.slice(0, 12)}`,
        email: `notif-repo-${suffix}@test.local`,
        phone: `+79${suffix.replace(/[a-f]/gi, '3').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    userId = user.id;

    const car = await prisma.car.create({
      data: {
        brand: 'N',
        model: 'R',
        licensePlate: `NR${suffix.slice(0, 8)}`,
        color: 'x',
        mileage: 1,
        fuelLevel: 1,
        isAvailable: true,
        carStatus: CarStatus.AVAILABLE,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      },
    });
    carId = car.id;

    geozoneRepository = new GeozoneRepository(prisma);
    const zone = await geozoneRepository.createWithInitialVersion({
      name: 'Зона notif',
      type: GeozoneType.RENTAL,
      color: '#111',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(0),
      rules: null,
      pricePerMinute: 1,
      pricePerKm: 1,
      pausePricePerMinute: 0,
    });
    if (!zone.currentVersionId) {
      throw new Error('currentVersionId');
    }
    geoZoneVersionId = zone.currentVersionId;

    tripRepository = new TripRepository(prisma);
    repository = new TripNotificationRepository(prisma);
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'violation_notification');
    await truncateApplicationTable(prisma, 'notification');
    await truncateApplicationTable(prisma, 'violation');
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff_preset');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'violation_notification');
    await truncateApplicationTable(prisma, 'notification');
    await truncateApplicationTable(prisma, 'violation');
    await truncateApplicationTable(prisma, 'telemetry');
    await truncateApplicationTable(prisma, 'trip');
    await truncateApplicationTable(prisma, 'tariff_preset');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'car');
    await truncateApplicationTable(prisma, 'user');
    await prisma.$disconnect();
  });

  describe('findAllByTripId', () => {
    it('возвращает пустой массив, если уведомлений с trip_id нет', async () => {
      const trip = await tripRepository.create({
        userId,
        carId,
        geoZoneVersionId,
        status: TripStatus.PENDING,
      });
      const list = await repository.findAllByTripId(trip.id);
      expect(list).toEqual([]);
    });

    it('возвращает уведомления с violationIds после createWithViolations', async () => {
      const trip = await tripRepository.create({
        userId,
        carId,
        geoZoneVersionId,
        status: TripStatus.PENDING,
      });
      const v1 = await prisma.violation.create({
        data: {
          tripId: trip.id,
          type: ViolationStatus.SPEEDING,
          description: 'a',
        },
      });
      const v2 = await prisma.violation.create({
        data: {
          tripId: trip.id,
          type: ViolationStatus.LOW_FUEL,
          description: 'b',
        },
      });

      await repository.createWithViolations({
        userId,
        tripId: trip.id,
        message: '{"kind":"test"}',
        status: ManagerNoticeDeliveryStatus.SENT,
        violationIds: [v1.id, v2.id],
      });

      const list = await repository.findAllByTripId(trip.id);
      expect(list).toHaveLength(1);
      expect(list[0]!.tripId).toBe(trip.id);
      expect(list[0]!.userId).toBe(userId);
      expect(list[0]!.status).toBe(ManagerNoticeDeliveryStatus.SENT);
      expect(list[0]!.message).toContain('test');
      expect(list[0]!.violationIds.sort()).toEqual([v1.id, v2.id].sort());
    });
  });

  describe('updateStatus', () => {
    it('обновляет статус', async () => {
      const trip = await tripRepository.create({
        userId,
        carId,
        geoZoneVersionId,
      });
      const v = await prisma.violation.create({
        data: {
          tripId: trip.id,
          type: ViolationStatus.SPEEDING,
          description: 'x',
        },
      });
      const { id } = await repository.createWithViolations({
        userId,
        tripId: trip.id,
        message: '{}',
        status: ManagerNoticeDeliveryStatus.PENDING,
        violationIds: [v.id],
      });
      await repository.updateStatus(id, ManagerNoticeDeliveryStatus.FAILED);
      const rows = await repository.findAllByTripId(trip.id);
      expect(rows[0]!.status).toBe(ManagerNoticeDeliveryStatus.FAILED);
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
