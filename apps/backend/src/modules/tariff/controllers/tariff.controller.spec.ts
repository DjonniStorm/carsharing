import { ConflictException, NotFoundException } from '@nestjs/common';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTables,
} from 'src/shared/testing';
import { TariffCreate } from '../entities/dtos/tariff.create';
import { TariffUpdate } from '../entities/dtos/tariff.update';
import { TariffRepository } from '../repositories/tariff.repository';
import { TariffService } from '../services/tariff.service';
import { TariffController } from './tariff.controller';

describe('TariffController', () => {
  let prisma: PrismaService;
  let repository: TariffRepository;
  let service: TariffService;
  let controller: TariffController;

  beforeEach(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
    await truncateApplicationTables(prisma);
    repository = new TariffRepository(prisma);
    service = new TariffService(repository);
    controller = new TariffController(service);
  });

  afterEach(async () => {
    await truncateApplicationTables(prisma);
  });

  afterAll(async () => {
    await truncateApplicationTables(prisma);
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('возвращает пустой список', async () => {
      const list = await controller.findAll(false);
      expect(list).toEqual([]);
    });

    it('возвращает пресеты и учитывает includeDeleted', async () => {
      const a = await controller.create(buildTariffCreate({ name: 'A' }));
      const b = await controller.create(buildTariffCreate({ name: 'B' }));

      const active = await controller.findAll(false);
      expect(active.length).toBe(2);

      await controller.delete(a.id);
      const withoutDeleted = await controller.findAll(false);
      expect(withoutDeleted.some((t) => t.id === a.id)).toBe(false);
      expect(withoutDeleted.some((t) => t.id === b.id)).toBe(true);

      const withDeleted = await controller.findAll(true);
      expect(withDeleted.some((t) => t.id === a.id)).toBe(true);
    });
  });

  describe('findById', () => {
    it('возвращает пресет', async () => {
      const created = await controller.create(buildTariffCreate());
      const found = await controller.findById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe(created.name);
    });

    it('NotFound если пресета нет', async () => {
      await expect(controller.findById(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('создаёт пресет', async () => {
      const dto = buildTariffCreate({ name: 'Новый' });
      const result = await controller.create(dto);
      expect(result.name).toBe(dto.name);
      expect(result.pricePerMinute).toBe(dto.pricePerMinute);
      expect(result.pricePerKm).toBe(dto.pricePerKm);
      expect(result.isDeleted).toBe(false);
    });
  });

  describe('update', () => {
    it('обновляет поля', async () => {
      const created = await controller.create(buildTariffCreate());
      const patch = new TariffUpdate();
      patch.name = 'Новое имя';
      patch.pricePerMinute = 2.5;
      const updated = await controller.update(created.id, patch);
      expect(updated.name).toBe('Новое имя');
      expect(updated.pricePerMinute).toBe(2.5);
    });

    it('NotFound для несуществующего id', async () => {
      const patch = new TariffUpdate();
      patch.name = 'x';
      await expect(controller.update(uuidv4(), patch)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('помечает пресет удалённым', async () => {
      const created = await controller.create(buildTariffCreate());
      const deleted = await controller.delete(created.id);
      expect(deleted.isDeleted).toBe(true);
    });

    it('NotFound если пресета нет', async () => {
      await expect(controller.delete(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Conflict при повторном удалении', async () => {
      const created = await controller.create(buildTariffCreate());
      await controller.delete(created.id);
      await expect(controller.delete(created.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});

function buildTariffCreate(
  overrides: Partial<{
    name: string;
    pricePerMinute: number;
    pricePerKm: number;
  }> = {},
): TariffCreate {
  const dto = new TariffCreate();
  dto.name = overrides.name ?? 'Базовый пресет';
  dto.pricePerMinute = overrides.pricePerMinute ?? 1.5;
  dto.pricePerKm = overrides.pricePerKm ?? 10;
  return dto;
}
