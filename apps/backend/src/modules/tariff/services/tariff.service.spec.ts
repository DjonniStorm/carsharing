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
  truncateApplicationTables,
} from 'src/shared/testing';
import {
  TariffAlreadyDeletedException,
  TariffNotFoundException,
} from '../common/errors';
import type { TariffCreate } from '../entities/dtos/tariff.create';
import type { TariffRead } from '../entities/dtos/tariff.read';
import type { TariffUpdate } from '../entities/dtos/tariff.update';
import { TariffRepository } from '../repositories/tariff.repository';
import { TariffService } from './tariff.service';

describe('TariffService (integration)', () => {
  let prisma: PrismaService;
  let service: TariffService;

  beforeAll(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateApplicationTables(prisma);
    const repository = new TariffRepository(prisma);
    service = new TariffService(repository);
  });

  afterEach(async () => {
    await truncateApplicationTables(prisma);
  });

  afterAll(async () => {
    await truncateApplicationTables(prisma);
    await prisma.$disconnect();
  });

  describe('findMany', () => {
    it('returns empty list when there are no presets', async () => {
      const result = await service.findMany();
      expect(result).toEqual([]);
    });

    it('returns created presets', async () => {
      const first = await service.create(
        createTariffInput({ name: 'A', pricePerMinute: 1, pricePerKm: 2 }),
      );
      const second = await service.create(
        createTariffInput({ name: 'B', pricePerMinute: 3, pricePerKm: 4 }),
      );

      const all = await service.findMany();
      expect(all).toHaveLength(2);
      expect(all.map((x) => x.id).sort()).toEqual([first.id, second.id].sort());
    });

    it('does not return soft-deleted presets unless includeDeleted=true', async () => {
      const tariff = await service.create(createTariffInput({ name: 'Del' }));
      await service.delete(tariff.id);

      const withoutDeleted = await service.findMany();
      expect(withoutDeleted).toEqual([]);

      const withDeleted = await service.findMany({ includeDeleted: true });
      expect(withDeleted).toHaveLength(1);
      expect(withDeleted[0].id).toBe(tariff.id);
      expect(withDeleted[0].isDeleted).toBe(true);
    });
  });

  describe('findById', () => {
    it('returns preset by id', async () => {
      const created = await service.create(
        createTariffInput({ name: 'Single' }),
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
    it('creates preset successfully', async () => {
      const input = createTariffInput({
        name: 'Created',
        pricePerMinute: 99.99,
        pricePerKm: 0.5,
        pausePricePerMinute: 1,
      });

      const created = await service.create(input);

      expect(created.id).toBeTruthy();
      expect(created.name).toBe(input.name);
      expect(created.pricePerMinute).toBe(input.pricePerMinute);
      expect(created.pricePerKm).toBe(input.pricePerKm);
      expect(created.pausePricePerMinute).toBe(1);
      expect(created.isDeleted).toBe(false);
    });
  });

  describe('update', () => {
    it('updates existing preset fields', async () => {
      const created = await service.create(
        createTariffInput({ name: 'Before' }),
      );

      const patch: TariffUpdate = {
        name: 'After',
        pricePerMinute: 12.34,
        pricePerKm: 5.67,
        pausePricePerMinute: 0.25,
      };

      const updated = await service.update(created.id, patch);

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('After');
      expect(updated.pricePerMinute).toBe(12.34);
      expect(updated.pricePerKm).toBe(5.67);
      expect(updated.pausePricePerMinute).toBe(0.25);
    });

    it('supports empty patch (edge case)', async () => {
      const created = await service.create(
        createTariffInput({ name: 'Stable' }),
      );

      const updated = await service.update(created.id, {});

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(created.name);
    });

    it('throws TariffNotFoundException when preset does not exist', async () => {
      await expect(service.update(randomUUID(), { name: 'X' })).rejects.toThrow(
        TariffNotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('soft-deletes preset', async () => {
      const created = await service.create(
        createTariffInput({ name: 'Delete' }),
      );

      const deleted = await service.delete(created.id);

      expect(deleted.id).toBe(created.id);
      expect(deleted.isDeleted).toBe(true);
    });

    it('throws TariffNotFoundException when preset does not exist', async () => {
      await expect(service.delete(randomUUID())).rejects.toThrow(
        TariffNotFoundException,
      );
    });

    it('throws TariffAlreadyDeletedException when already deleted', async () => {
      const created = await service.create(
        createTariffInput({ name: 'Double delete' }),
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
  })();

  input.name = overrides.name ?? 'Default preset';
  input.pricePerMinute = overrides.pricePerMinute ?? 10;
  input.pricePerKm = overrides.pricePerKm ?? 2;
  if (overrides.pausePricePerMinute !== undefined) {
    input.pausePricePerMinute = overrides.pausePricePerMinute;
  }
  if (overrides.isDefault !== undefined) {
    input.isDefault = overrides.isDefault;
  }

  return input;
};

const assertTariffEquals = (actual: TariffRead, expected: TariffRead) => {
  expect(actual.id).toBe(expected.id);
  expect(actual.name).toBe(expected.name);
  expect(actual.pricePerMinute).toBe(expected.pricePerMinute);
  expect(actual.pricePerKm).toBe(expected.pricePerKm);
  expect(actual.pausePricePerMinute).toBe(expected.pausePricePerMinute);
  expect(actual.isDefault).toBe(expected.isDefault);
  expect(actual.isDeleted).toBe(expected.isDeleted);
};
