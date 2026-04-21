import { randomUUID } from 'node:crypto';

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import {
  TariffAlreadyDeletedException,
  TariffGeoZoneNotFoundException,
  TariffNotFoundException,
} from '../common/errors';
import type { TariffCreate } from '../entities/dtos/tariff.create';
import type { TariffRead } from '../entities/dtos/tariff.read';
import type { TariffUpdate } from '../entities/dtos/tariff.update';
import { GeozoneType } from '../../geozone/entities/geozone.type';
import type { GeoJSONMultiPolygon } from '../../geozone/entities/geozone.geometry';
import { GeozoneRepository } from '../../geozone/repositories/geozone.repository';
import { TariffRepository } from '../repositories/tariff.repository';
import { TariffService } from './tariff.service';

describe('TariffService (integration)', () => {
  let prisma: PrismaService;
  let service: TariffService;
  let geozoneRepository: GeozoneRepository;

  let userId: string;
  let geoZoneId: string;
  let secondGeoZoneId: string;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateApplicationTable(prisma, 'tariff');
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'user');

    const suffix = randomUUID().replace(/-/g, '');
    const user = await prisma.user.create({
      data: {
        name: `Tariff Service ${suffix.slice(0, 12)}`,
        email: `tariff-service-${suffix}@test.local`,
        phone: `+79${suffix.replace(/[a-f]/gi, '3').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    userId = user.id;

    geozoneRepository = new GeozoneRepository(prisma);
    const zone = await geozoneRepository.createWithInitialVersion({
      name: 'Tariff zone',
      type: GeozoneType.RENTAL,
      color: '#101010',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(0),
      rules: null,
    });
    geoZoneId = zone.id;

    const secondZone = await geozoneRepository.createWithInitialVersion({
      name: 'Second tariff zone',
      type: GeozoneType.RENTAL,
      color: '#202020',
      createdByUserId: userId,
      geometry: sampleMultiPolygon(1),
      rules: null,
    });
    secondGeoZoneId = secondZone.id;

    const repository = new TariffRepository(prisma);
    service = new TariffService(repository);
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
    it('returns empty list when there are no tariffs', async () => {
      const result = await service.findMany();
      expect(result).toEqual([]);
    });

    it('returns created tariffs and supports geoZoneId filter', async () => {
      const first = await service.create(
        createTariffInput({ name: 'A', geoZoneId }),
      );
      const second = await service.create(
        createTariffInput({ name: 'B', geoZoneId: secondGeoZoneId }),
      );

      const all = await service.findMany();
      expect(all).toHaveLength(2);
      expect(all.map((x) => x.id).sort()).toEqual([first.id, second.id].sort());

      const onlyFirstZone = await service.findMany({ geoZoneId });
      expect(onlyFirstZone).toHaveLength(1);
      expect(onlyFirstZone[0].id).toBe(first.id);
    });

    it('does not return soft-deleted tariffs unless includeDeleted=true', async () => {
      const tariff = await service.create(
        createTariffInput({ name: 'Delete me', geoZoneId }),
      );
      await service.delete(tariff.id);

      const withoutDeleted = await service.findMany();
      expect(withoutDeleted).toEqual([]);

      const withDeleted = await service.findMany({ includeDeleted: true });
      expect(withDeleted).toHaveLength(1);
      expect(withDeleted[0].id).toBe(tariff.id);
      expect(withDeleted[0].deletedAt).not.toBeNull();
    });
  });

  describe('findById', () => {
    it('returns tariff by id', async () => {
      const created = await service.create(
        createTariffInput({ name: 'Single', geoZoneId }),
      );

      const found = await service.findById(created.id);

      assertTariffEquals(found, created);
    });

    it('throws TariffNotFoundException for unknown id', async () => {
      await expect(service.findById(randomUUID())).rejects.toThrow(
        TariffNotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates tariff successfully', async () => {
      const input = createTariffInput({
        name: 'Created',
        pricePerMinute: 99.99,
        pricePerKm: 0.5,
        geoZoneId,
      });

      const created = await service.create(input);

      expect(created.id).toBeTruthy();
      expect(created.name).toBe(input.name);
      expect(created.pricePerMinute).toBe(input.pricePerMinute);
      expect(created.pricePerKm).toBe(input.pricePerKm);
      expect(created.geoZoneId).toBe(input.geoZoneId);
      expect(created.deletedAt).toBeNull();
    });

    it('throws TariffGeoZoneNotFoundException for invalid geoZoneId', async () => {
      await expect(
        service.create(createTariffInput({ geoZoneId: randomUUID() })),
      ).rejects.toThrow(TariffGeoZoneNotFoundException);
    });
  });

  describe('update', () => {
    it('updates existing tariff fields', async () => {
      const created = await service.create(
        createTariffInput({ name: 'Before', geoZoneId }),
      );

      const patch: TariffUpdate = {
        name: 'After',
        pricePerMinute: 12.34,
        pricePerKm: 5.67,
        geoZoneId: secondGeoZoneId,
      };

      const updated = await service.update(created.id, patch);

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('After');
      expect(updated.pricePerMinute).toBe(12.34);
      expect(updated.pricePerKm).toBe(5.67);
      expect(updated.geoZoneId).toBe(secondGeoZoneId);
    });

    it('supports empty patch (edge case)', async () => {
      const created = await service.create(
        createTariffInput({ name: 'Stable', geoZoneId }),
      );

      const updated = await service.update(created.id, {});

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(created.name);
      expect(updated.pricePerMinute).toBe(created.pricePerMinute);
      expect(updated.pricePerKm).toBe(created.pricePerKm);
      expect(updated.geoZoneId).toBe(created.geoZoneId);
    });

    it('throws TariffNotFoundException when tariff does not exist', async () => {
      await expect(service.update(randomUUID(), { name: 'X' })).rejects.toThrow(
        TariffNotFoundException,
      );
    });

    it('throws TariffGeoZoneNotFoundException for invalid geoZoneId', async () => {
      const created = await service.create(
        createTariffInput({ name: 'To patch', geoZoneId }),
      );

      await expect(
        service.update(created.id, { geoZoneId: randomUUID() }),
      ).rejects.toThrow(TariffGeoZoneNotFoundException);
    });
  });

  describe('delete', () => {
    it('soft-deletes tariff', async () => {
      const created = await service.create(
        createTariffInput({ name: 'Delete', geoZoneId }),
      );

      const deleted = await service.delete(created.id);

      expect(deleted.id).toBe(created.id);
      expect(deleted.deletedAt).not.toBeNull();

      await expect(service.findById(created.id)).resolves.toMatchObject({
        id: created.id,
      });
    });

    it('throws TariffNotFoundException when tariff does not exist', async () => {
      await expect(service.delete(randomUUID())).rejects.toThrow(
        TariffNotFoundException,
      );
    });

    it('throws TariffAlreadyDeletedException when tariff already deleted', async () => {
      const created = await service.create(
        createTariffInput({ name: 'Double delete', geoZoneId }),
      );
      await service.delete(created.id);

      await expect(service.delete(created.id)).rejects.toThrow(
        TariffAlreadyDeletedException,
      );
    });
  });
});

const createTariffInput = (
  overrides: Partial<TariffCreate> = {},
): TariffCreate => {
  const input = new (class implements TariffCreate {
    name = '';
    pricePerMinute = 0;
    pricePerKm = 0;
    geoZoneId = '';
  })();

  input.name = overrides.name ?? 'Default tariff';
  input.pricePerMinute = overrides.pricePerMinute ?? 10;
  input.pricePerKm = overrides.pricePerKm ?? 2;
  if (!overrides.geoZoneId) {
    throw new Error('geoZoneId is required for createTariffInput');
  }
  input.geoZoneId = overrides.geoZoneId;

  return input;
};

const assertTariffEquals = (actual: TariffRead, expected: TariffRead) => {
  expect(actual.id).toBe(expected.id);
  expect(actual.name).toBe(expected.name);
  expect(actual.pricePerMinute).toBe(expected.pricePerMinute);
  expect(actual.pricePerKm).toBe(expected.pricePerKm);
  expect(actual.geoZoneId).toBe(expected.geoZoneId);
  expect(actual.deletedAt).toEqual(expected.deletedAt);
};

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
