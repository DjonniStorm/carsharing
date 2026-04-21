import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import { GeozoneRepository } from '../../geozone/repositories/geozone.repository';
import type { GeoJSONMultiPolygon } from '../../geozone/entities/geozone.geometry';
import { GeozoneType } from '../../geozone/entities/geozone.type';
import { TariffEntity } from '../entities/tariff.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { TariffRepository } from './tariff.repository';

describe('TariffRepository', () => {
  let repository: TariffRepository;
  let prisma: PrismaService;
  let geozoneRepository: GeozoneRepository;
  let createdByUserId: string;
  let geoZoneId: string;
  let geoZoneIdOther: string;

  beforeEach(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'user');

    const suffix = uuidv4().replace(/-/g, '');
    const user = await prisma.user.create({
      data: {
        name: `Tariff repo ${suffix.slice(0, 12)}`,
        email: `tariff-repo-${suffix}@test.local`,
        phone: `+75${suffix.replace(/[a-f]/gi, '4').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    createdByUserId = user.id;

    geozoneRepository = new GeozoneRepository(prisma);
    const zone = await geozoneRepository.createWithInitialVersion({
      name: 'Зона под тариф',
      type: GeozoneType.RENTAL,
      color: '#111111',
      createdByUserId,
      geometry: sampleMultiPolygon(0),
      rules: null,
    });
    geoZoneId = zone.id;

    const zoneOther = await geozoneRepository.createWithInitialVersion({
      name: 'Другая зона',
      type: GeozoneType.RENTAL,
      color: '#222222',
      createdByUserId,
      geometry: sampleMultiPolygon(1),
      rules: null,
    });
    geoZoneIdOther = zoneOther.id;

    repository = new TariffRepository(prisma);
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'user');
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'user');
    await prisma.$disconnect();
  });

  describe('findMany', () => {
    it('возвращает пустой массив, если тарифов нет', async () => {
      const tariffs = await repository.findMany();
      expect(tariffs).toEqual([]);
    });

    it('возвращает созданные тарифы с полями как в сущности', async () => {
      const tariff1 = await repository.create({
        name: 'Тариф A',
        pricePerMinute: 1.5,
        pricePerKm: 2.25,
        geoZoneId,
      });
      const tariff2 = await repository.create({
        name: 'Тариф B',
        pricePerMinute: 200,
        pricePerKm: 20,
        geoZoneId,
      });
      const tariffs = await repository.findMany();
      expect(tariffs).toHaveLength(2);
      const byId = new Map(tariffs.map((t) => [t.id, t]));
      assertTariffEquals(byId.get(tariff1.id)!, tariff1);
      assertTariffEquals(byId.get(tariff2.id)!, tariff2);
    });

    it('сортирует по createdAt по убыванию (новее — раньше в списке)', async () => {
      const first = await repository.create({
        name: 'Старый',
        pricePerMinute: 1,
        pricePerKm: 1,
        geoZoneId,
      });
      const second = await repository.create({
        name: 'Новее',
        pricePerMinute: 2,
        pricePerKm: 2,
        geoZoneId,
      });
      const list = await repository.findMany();
      expect(list.map((t) => t.id)).toEqual([second.id, first.id]);
    });

    it('фильтрует по geoZoneId', async () => {
      await repository.create({
        name: 'В своей зоне',
        pricePerMinute: 10,
        pricePerKm: 1,
        geoZoneId,
      });
      const otherZoneTariff = await repository.create({
        name: 'В другой зоне',
        pricePerMinute: 20,
        pricePerKm: 2,
        geoZoneId: geoZoneIdOther,
      });

      const onlyFirst = await repository.findMany({ geoZoneId });
      expect(onlyFirst).toHaveLength(1);
      expect(onlyFirst[0].id).not.toBe(otherZoneTariff.id);

      const onlyOther = await repository.findMany({
        geoZoneId: geoZoneIdOther,
      });
      expect(onlyOther).toHaveLength(1);
      expect(onlyOther[0].id).toBe(otherZoneTariff.id);
    });

    it('по умолчанию не возвращает софт-удалённые', async () => {
      const t = await repository.create({
        name: 'Удалим',
        pricePerMinute: 1,
        pricePerKm: 1,
        geoZoneId,
      });
      await repository.setDeletedAt(t.id, new Date());

      const activeOnly = await repository.findMany();
      expect(activeOnly).toHaveLength(0);

      const withDeleted = await repository.findMany({ includeDeleted: true });
      expect(withDeleted.map((x) => x.id)).toContain(t.id);
    });
  });

  describe('findById', () => {
    it('возвращает null, если тарифа с таким id нет', async () => {
      const found = await repository.findById(randomUUID());
      expect(found).toBeNull();
    });

    it('возвращает тариф по id', async () => {
      const created = await repository.create({
        name: 'Один',
        pricePerMinute: 3,
        pricePerKm: 4,
        geoZoneId,
      });
      const found = await repository.findById(created.id);
      expect(found).not.toBeNull();
      assertTariffEquals(found!, created);
    });

    it('withGeoZone: true не ломает выборку и маппинг в TariffEntity', async () => {
      const created = await repository.create({
        name: 'С зоной',
        pricePerMinute: 5,
        pricePerKm: 6,
        geoZoneId,
      });
      const found = await repository.findById(created.id, {
        withGeoZone: true,
      });
      expect(found).not.toBeNull();
      assertTariffEquals(found!, created);
    });
  });

  describe('create', () => {
    it('создаёт тариф и его можно прочитать обратно', async () => {
      const created = await repository.create({
        name: 'Новый',
        pricePerMinute: 99.99,
        pricePerKm: 0.5,
        geoZoneId,
      });
      const again = await repository.findById(created.id);
      expect(again).not.toBeNull();
      assertTariffEquals(again!, created);
    });

    it('бросает при несуществующем geoZoneId (FK)', async () => {
      await expect(
        repository.create({
          name: 'Битая зона',
          pricePerMinute: 1,
          pricePerKm: 1,
          geoZoneId: randomUUID(),
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  describe('update', () => {
    it('обновляет поля и возвращает актуальную сущность', async () => {
      const t = await repository.create({
        name: 'До',
        pricePerMinute: 1,
        pricePerKm: 1,
        geoZoneId,
      });
      const updated = await repository.update(t.id, {
        name: 'После',
        pricePerMinute: 11,
        pricePerKm: 22,
      });
      expect(updated.name).toBe('После');
      expect(updated.pricePerMinute).toBe(11);
      expect(updated.pricePerKm).toBe(22);

      const fromDb = await repository.findById(t.id);
      expect(fromDb!.name).toBe('После');
    });

    it('можно сменить geoZoneId на другую существующую зону', async () => {
      const t = await repository.create({
        name: 'Переезд',
        pricePerMinute: 1,
        pricePerKm: 1,
        geoZoneId,
      });
      const updated = await repository.update(t.id, {
        geoZoneId: geoZoneIdOther,
      });
      expect(updated.geoZoneId).toBe(geoZoneIdOther);
    });

    it('P2025 если тарифа с таким id нет', async () => {
      await expect(
        repository.update(randomUUID(), { name: 'никому' }),
      ).rejects.toMatchObject({ code: 'P2025' });
    });

    it('P2003 если указан несуществующий geoZoneId', async () => {
      const t = await repository.create({
        name: 'T',
        pricePerMinute: 1,
        pricePerKm: 1,
        geoZoneId,
      });
      await expect(
        repository.update(t.id, { geoZoneId: randomUUID() }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  describe('setDeletedAt', () => {
    it('выставляет deletedAt и снимает его обратно', async () => {
      const t = await repository.create({
        name: 'Soft',
        pricePerMinute: 1,
        pricePerKm: 1,
        geoZoneId,
      });
      const at = new Date('2024-06-01T12:00:00.000Z');
      const deleted = await repository.setDeletedAt(t.id, at);
      expect(deleted.deletedAt?.getTime()).toBe(at.getTime());

      const restored = await repository.setDeletedAt(t.id, null);
      expect(restored.deletedAt).toBeNull();
    });

    it('P2025 если тарифа с таким id нет', async () => {
      await expect(
        repository.setDeletedAt(randomUUID(), new Date()),
      ).rejects.toMatchObject({ code: 'P2025' });
    });
  });
});

const assertTariffEquals = (actual: TariffEntity, expected: TariffEntity) => {
  expect(actual.id).toBe(expected.id);
  expect(actual.name).toBe(expected.name);
  expect(actual.pricePerMinute).toBe(expected.pricePerMinute);
  expect(actual.pricePerKm).toBe(expected.pricePerKm);
  expect(actual.geoZoneId).toBe(expected.geoZoneId);
  expect(actual.createdAt.getTime()).toBe(expected.createdAt.getTime());
  expect(actual.updatedAt.getTime()).toBe(expected.updatedAt.getTime());
  expect(actual.deletedAt).toEqual(expected.deletedAt);
};

/** Как в `geozone.repository.spec.ts`. */
const sampleMultiPolygon = (seed: number): GeoJSONMultiPolygon => {
  const baseLon = 35 + seed * 0.01;
  return {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [baseLon, 55.7] as any,
          [baseLon + 0.15, 55.7],
          [baseLon + 0.15, 55.85],
          [baseLon, 55.85],
          [baseLon, 55.7],
        ],
      ],
    ],
  };
};
