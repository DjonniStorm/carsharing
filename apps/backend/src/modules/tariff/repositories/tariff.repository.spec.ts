import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TariffPresetEntity } from '../entities/tariff.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTables,
} from 'src/shared/testing';
import { TariffRepository } from './tariff.repository';

describe('TariffRepository', () => {
  let repository: TariffRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
    await truncateApplicationTables(prisma);
    repository = new TariffRepository(prisma);
  });

  afterEach(async () => {
    await truncateApplicationTables(prisma);
  });

  afterAll(async () => {
    await truncateApplicationTables(prisma);
    await prisma.$disconnect();
  });

  describe('findMany', () => {
    it('возвращает пустой массив, если пресетов нет', async () => {
      const tariffs = await repository.findMany();
      expect(tariffs).toEqual([]);
    });

    it('возвращает созданные пресеты с полями как в сущности', async () => {
      const tariff1 = await repository.create({
        name: 'Тариф A',
        pricePerMinute: 1.5,
        pricePerKm: 2.25,
        pausePricePerMinute: 0,
        isDefault: false,
      });
      const tariff2 = await repository.create({
        name: 'Тариф B',
        pricePerMinute: 200,
        pricePerKm: 20,
        pausePricePerMinute: 1,
        isDefault: false,
      });
      const tariffs = await repository.findMany();
      expect(tariffs).toHaveLength(2);
      const byId = new Map(tariffs.map((t) => [t.id, t]));
      assertTariffEquals(byId.get(tariff1.id)!, tariff1);
      assertTariffEquals(byId.get(tariff2.id)!, tariff2);
    });

    it('не возвращает удалённые без includeDeleted', async () => {
      const t = await repository.create({
        name: 'X',
        pricePerMinute: 1,
        pricePerKm: 1,
        pausePricePerMinute: 0,
        isDefault: false,
      });
      await repository.update(t.id, { isDeleted: true });
      const active = await repository.findMany();
      expect(active).toHaveLength(0);
      const all = await repository.findMany({ includeDeleted: true });
      expect(all).toHaveLength(1);
    });
  });

  describe('findActiveById', () => {
    it('возвращает null для удалённого пресета', async () => {
      const t = await repository.create({
        name: 'Del',
        pricePerMinute: 1,
        pricePerKm: 1,
        pausePricePerMinute: 0,
        isDefault: false,
      });
      await repository.update(t.id, { isDeleted: true });
      await expect(repository.findActiveById(t.id)).resolves.toBeNull();
    });
  });

  describe('create / update', () => {
    it('findById после create', async () => {
      const created = await repository.create({
        name: 'One',
        pricePerMinute: 10,
        pricePerKm: 5,
        pausePricePerMinute: 0.5,
        isDefault: false,
      });
      const found = await repository.findById(created.id);
      assertTariffEquals(found!, created);
    });

    it('isDefault: новый пресет становится единственным default', async () => {
      const a = await repository.create({
        name: 'A',
        pricePerMinute: 1,
        pricePerKm: 1,
        pausePricePerMinute: 0,
        isDefault: true,
      });
      const b = await repository.create({
        name: 'B',
        pricePerMinute: 2,
        pricePerKm: 2,
        pausePricePerMinute: 0,
        isDefault: true,
      });
      const againA = await repository.findById(a.id);
      expect(againA!.isDefault).toBe(false);
      expect(b.isDefault).toBe(true);
    });
  });
});

function assertTariffEquals(
  actual: TariffPresetEntity,
  expected: TariffPresetEntity,
) {
  expect(actual.id).toBe(expected.id);
  expect(actual.name).toBe(expected.name);
  expect(actual.pricePerMinute).toBe(expected.pricePerMinute);
  expect(actual.pricePerKm).toBe(expected.pricePerKm);
  expect(actual.pausePricePerMinute).toBe(expected.pausePricePerMinute);
  expect(actual.isDefault).toBe(expected.isDefault);
  expect(actual.isDeleted).toBe(expected.isDeleted);
}
