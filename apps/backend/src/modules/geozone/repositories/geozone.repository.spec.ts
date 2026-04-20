import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import { GeozoneNotFoundException } from '../common/errors';
import type {
  GeoJSONMultiPolygon,
  GeoJSONPosition,
} from '../entities/geozone.geometry';
import { GeozoneType } from '../entities/geozone.type';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { GeozoneRepository } from './geozone.repository';

/**
 * Приватные `buildListWhere`, `geometryByVersionIds`, `attachCurrentVersions`
 * проверяются через публичные методы репозитория.
 */
describe('GeozoneRepository', () => {
  let prisma: PrismaService;
  let repository: GeozoneRepository;
  let createdByUserId: string;

  beforeEach(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');

    const suffix = uuidv4().replace(/-/g, '');
    const user = await prisma.user.create({
      data: {
        name: `Repo geozone ${suffix.slice(0, 12)}`,
        email: `geozone-repo-${suffix}@test.local`,
        phone: `+77${suffix.replace(/[a-f]/gi, '2').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    createdByUserId = user.id;
    repository = new GeozoneRepository(prisma);
  });

  afterEach(async () => {
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'user');
  });

  afterAll(async () => {
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'user');
    await prisma.$disconnect();
  });

  describe('findMany', () => {
    it('возвращает пустой массив если зон нет', async () => {
      const geozones = await repository.findMany();
      expect(geozones).toEqual([]);
    });

    it('при onlyDeleted и includeDeleted одновременно приоритет у onlyDeleted (приватный buildListWhere)', async () => {
      const activeInput = buildCreateInput(createdByUserId, {
        geometry: sampleMultiPolygon(1),
      });
      const deletedInput = buildCreateInput(createdByUserId, {
        name: 'Удалённая',
        geometry: sampleMultiPolygon(2),
      });
      const active = await repository.createWithInitialVersion(activeInput);
      const toRemove = await repository.createWithInitialVersion(deletedInput);
      await repository.setDeletedAt(toRemove.id, new Date());

      const list = await repository.findMany({
        onlyDeleted: true,
        includeDeleted: true,
      });
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(toRemove.id);
      expect(active.id).not.toBe(list[0].id);
    });

    it('includeDeleted без onlyDeleted возвращает и удалённые зоны', async () => {
      const first = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(3) }),
      );
      const second = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, {
          name: 'Вторая',
          geometry: sampleMultiPolygon(4),
        }),
      );
      await repository.setDeletedAt(second.id, new Date());
      const list = await repository.findMany({ includeDeleted: true });
      const ids = list.map((zone) => zone.id).sort();
      expect(ids).toEqual([first.id, second.id].sort());
    });

    it('withCurrentVersion подставляет currentVersion с геометрией', async () => {
      const created = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(10) }),
      );
      const list = await repository.findMany({ withCurrentVersion: true });
      const found = list.find((z) => z.id === created.id);
      expect(found?.currentVersion?.geometry.type).toBe('MultiPolygon');
    });

    it('skip/take ограничивают выборку', async () => {
      for (let i = 0; i < 3; i++) {
        await repository.createWithInitialVersion(
          buildCreateInput(createdByUserId, {
            name: `Z-${i}`,
            geometry: sampleMultiPolygon(20 + i),
          }),
        );
      }
      const page = await repository.findMany({ skip: 0, take: 2 });
      expect(page.length).toBe(2);
    });
  });

  describe('findById', () => {
    it('возвращает null если id не существует', async () => {
      expect(await repository.findById(uuidv4())).toBeNull();
    });

    it('с withCurrentVersion возвращает GeoJSON геометрию версии', async () => {
      const geometry = sampleMultiPolygon(5);
      const created = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry }),
      );
      const loaded = await repository.findById(created.id, {
        withCurrentVersion: true,
      });
      expect(loaded?.currentVersion?.geometry.type).toBe('MultiPolygon');
      expect(loaded?.currentVersion?.geometry.coordinates).toHaveLength(
        geometry.coordinates.length,
      );
    });

    it('без withCurrentVersion не заполняет currentVersion', async () => {
      const created = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(7) }),
      );
      const loaded = await repository.findById(created.id);
      expect(loaded?.currentVersionId).not.toBeNull();
      expect(loaded?.currentVersion).toBeUndefined();
    });
  });

  describe('findByIds', () => {
    it('пустой список id даёт пустой массив', async () => {
      expect(await repository.findByIds([], true)).toEqual([]);
    });

    it('возвращает только существующие зоны и опционально с версией', async () => {
      const a = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(8) }),
      );
      const b = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, {
          name: 'B',
          geometry: sampleMultiPolygon(9),
        }),
      );
      const found = await repository.findByIds([a.id, uuidv4(), b.id], true);
      expect(found.length).toBe(2);
      for (const z of found) {
        expect(z.currentVersion?.geometry.type).toBe('MultiPolygon');
      }
    });
  });

  describe('createWithInitialVersion', () => {
    it('создаёт зону с currentVersionId и геометрией', async () => {
      const created = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(11) }),
      );
      expect(created.currentVersionId).not.toBeNull();
      expect(created.deletedAt).toBeNull();
      const loaded = await repository.findById(created.id, {
        withCurrentVersion: true,
      });
      expect(loaded?.currentVersion).toBeDefined();
    });

    it('сохраняет rules как json', async () => {
      const created = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, {
          geometry: sampleMultiPolygon(12),
          rules: { a: 1 },
        }),
      );
      const loaded = await repository.findById(created.id, {
        withCurrentVersion: true,
      });
      expect(loaded?.currentVersion?.rules).toEqual({ a: 1 });
    });
  });

  describe('updateZone', () => {
    it('обновляет поля', async () => {
      const created = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(13) }),
      );
      const updated = await repository.updateZone(created.id, {
        name: 'Новое',
        type: GeozoneType.PARKING,
        color: '#fff',
      });
      expect(updated.name).toBe('Новое');
      expect(updated.type).toBe(GeozoneType.PARKING);
      expect(updated.color).toBe('#fff');
    });

    it('пустой патч без зоны — GeozoneNotFoundException', async () => {
      await expect(repository.updateZone(uuidv4(), {})).rejects.toThrow(
        GeozoneNotFoundException,
      );
    });

    it('патч с полями для несуществующего id — ошибка', async () => {
      await expect(
        repository.updateZone(uuidv4(), { name: 'x' }),
      ).rejects.toThrow(GeozoneNotFoundException);
    });
  });

  describe('setDeletedAt', () => {
    it('выставляет deletedAt', async () => {
      const created = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(14) }),
      );
      const when = new Date();
      const updated = await repository.setDeletedAt(created.id, when);
      expect(updated.deletedAt).not.toBeNull();
    });

    it('несуществующий id — ошибка', async () => {
      await expect(
        repository.setDeletedAt(uuidv4(), new Date()),
      ).rejects.toThrow(GeozoneNotFoundException);
    });
  });

  describe('publishNewVersion', () => {
    it('добавляет вторую версию и переключает current', async () => {
      const zone = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(15) }),
      );
      const v1 = zone.currentVersionId;
      const next = sampleMultiPolygon(16);
      const after = await repository.publishNewVersion(zone.id, {
        geometry: next,
        rules: { v: 2 },
        pricePerMinute: 2,
        pricePerKm: 11,
        pausePricePerMinute: 0.5,
      });
      expect(after.currentVersionId).not.toBe(v1);
      const versions = await repository.findVersions(zone.id, {
        includeDisabled: true,
      });
      expect(versions.length).toBe(2);
    });

    it('несуществующая зона — GeozoneNotFoundException', async () => {
      await expect(
        repository.publishNewVersion(uuidv4(), {
          geometry: sampleMultiPolygon(17),
          rules: null,
          pricePerMinute: 1,
          pricePerKm: 1,
          pausePricePerMinute: 1,
        }),
      ).rejects.toThrow(GeozoneNotFoundException);
    });
  });

  describe('findVersions', () => {
    it('для несуществующей зоны возвращает пустой массив (уровень репозитория)', async () => {
      expect(await repository.findVersions(uuidv4())).toEqual([]);
    });

    it('загружает геометрию для каждой версии в списке', async () => {
      const zone = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(6) }),
      );
      const versions = await repository.findVersions(zone.id, {
        includeDisabled: true,
      });
      expect(versions.length).toBe(1);
      expect(versions[0].geometry.type).toBe('MultiPolygon');
    });
  });

  describe('findVersionById', () => {
    it('null для несуществующего id', async () => {
      expect(await repository.findVersionById(uuidv4())).toBeNull();
    });

    it('возвращает версию с геометрией', async () => {
      const zone = await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(18) }),
      );
      const v = await repository.findVersionById(zone.currentVersionId!);
      expect(v?.geozoneId).toBe(zone.id);
      expect(v?.geometry.type).toBe('MultiPolygon');
    });
  });

  describe('findIdsInBoundingBox', () => {
    it('находит зону, если bbox пересекает полигон', async () => {
      await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(19) }),
      );
      const base = 35.19;
      const ids = await repository.findIdsInBoundingBox({
        minLon: base - 1,
        minLat: 55.5,
        maxLon: base + 1,
        maxLat: 56.0,
      });
      expect(ids.length).toBeGreaterThanOrEqual(1);
    });

    it('пусто, если bbox далеко', async () => {
      await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(21) }),
      );
      const ids = await repository.findIdsInBoundingBox({
        minLon: 0,
        minLat: 0,
        maxLon: 1,
        maxLat: 1,
      });
      expect(ids).toEqual([]);
    });
  });

  describe('findIdsContainingPoint', () => {
    it('находит зону, если точка внутри', async () => {
      await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(22) }),
      );
      const base = 35.22;
      const ids = await repository.findIdsContainingPoint({
        lon: base + 0.05,
        lat: 55.775,
      });
      expect(ids.length).toBeGreaterThanOrEqual(1);
    });

    it('пусто, если точка снаружи', async () => {
      await repository.createWithInitialVersion(
        buildCreateInput(createdByUserId, { geometry: sampleMultiPolygon(23) }),
      );
      const ids = await repository.findIdsContainingPoint({
        lon: 0,
        lat: 0,
      });
      expect(ids).toEqual([]);
    });
  });
});

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

const buildCreateInput = (
  userId: string,
  overrides: Partial<{
    name: string;
    type: string;
    color: string;
    geometry: GeoJSONMultiPolygon;
    rules: Record<string, unknown> | null;
    pricePerMinute: number;
    pricePerKm: number;
    pausePricePerMinute: number;
  }> = {},
) => {
  return {
    name: overrides.name ?? 'Repo zone',
    type: overrides.type ?? GeozoneType.RENTAL,
    color: overrides.color ?? '#111111',
    createdByUserId: userId,
    geometry: overrides.geometry ?? sampleMultiPolygon(0),
    rules: overrides.rules !== undefined ? overrides.rules : null,
    pricePerMinute: overrides.pricePerMinute ?? 1.5,
    pricePerKm: overrides.pricePerKm ?? 10,
    pausePricePerMinute: overrides.pausePricePerMinute ?? 0.25,
  };
};
