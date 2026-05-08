import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTables,
} from 'src/shared/testing';
import { GeozoneType } from '../../geozone/entities/geozone.type';
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

    it('возвращает тарифы и учитывает includeDeleted', async () => {
      const { geoZoneId } = await seedUserAndGeoZone(prisma);
      const a = await controller.create(buildTariffCreate(geoZoneId, { name: 'A' }));
      const b = await controller.create(buildTariffCreate(geoZoneId, { name: 'B' }));

      const active = await controller.findAll(false);
      expect(active.length).toBe(2);

      await controller.delete(a.id);
      const withoutDeleted = await controller.findAll(false);
      expect(withoutDeleted.some((t) => t.id === a.id)).toBe(false);
      expect(withoutDeleted.some((t) => t.id === b.id)).toBe(true);

      const withDeleted = await controller.findAll(true);
      expect(withDeleted.some((t) => t.id === a.id)).toBe(true);
    });

    it('фильтрует по geoZoneId', async () => {
      const { geoZoneId: z1 } = await seedUserAndGeoZone(prisma);
      const { geoZoneId: z2 } = await seedUserAndGeoZone(prisma);
      await controller.create(buildTariffCreate(z1, { name: 'T1' }));
      await controller.create(buildTariffCreate(z2, { name: 'T2' }));

      const forZ1 = await controller.findAll(false, z1);
      expect(forZ1.length).toBe(1);
      expect(forZ1[0].name).toBe('T1');
    });
  });

  describe('findById', () => {
    it('возвращает тариф', async () => {
      const { geoZoneId } = await seedUserAndGeoZone(prisma);
      const created = await controller.create(buildTariffCreate(geoZoneId));
      const found = await controller.findById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe(created.name);
    });

    it('NotFound если тарифа нет', async () => {
      await expect(controller.findById(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('создаёт тариф', async () => {
      const { geoZoneId } = await seedUserAndGeoZone(prisma);
      const dto = buildTariffCreate(geoZoneId);
      const result = await controller.create(dto);
      expect(result.geoZoneId).toBe(geoZoneId);
      expect(result.name).toBe(dto.name);
      expect(result.pricePerMinute).toBe(dto.pricePerMinute);
      expect(result.pricePerKm).toBe(dto.pricePerKm);
    });

    it('BadRequest если геозоны нет', async () => {
      const dto = buildTariffCreate(uuidv4());
      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('обновляет поля', async () => {
      const { geoZoneId } = await seedUserAndGeoZone(prisma);
      const created = await controller.create(buildTariffCreate(geoZoneId));
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
    it('помечает тариф удалённым', async () => {
      const { geoZoneId } = await seedUserAndGeoZone(prisma);
      const created = await controller.create(buildTariffCreate(geoZoneId));
      const deleted = await controller.delete(created.id);
      expect(deleted.deletedAt).not.toBeNull();
    });

    it('NotFound если тарифа нет', async () => {
      await expect(controller.delete(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Conflict при повторном удалении', async () => {
      const { geoZoneId } = await seedUserAndGeoZone(prisma);
      const created = await controller.create(buildTariffCreate(geoZoneId));
      await controller.delete(created.id);
      await expect(controller.delete(created.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});

async function seedUserAndGeoZone(
  prisma: PrismaService,
): Promise<{ userId: string; geoZoneId: string }> {
  const suffix = uuidv4().replace(/-/g, '');
  const user = await prisma.user.create({
    data: {
      name: `Tariff ctrl ${suffix.slice(0, 12)}`,
      email: `tariff-ctrl-${suffix}@test.local`,
      phone: `+78${suffix.replace(/[a-f]/gi, '3').slice(0, 10)}`,
      passwordHash: 'hash',
      role: 0,
      isActive: true,
      isDeleted: false,
    },
  });
  const zone = await prisma.geoZone.create({
    data: {
      name: 'Зона для тарифа',
      type: GeozoneType.RENTAL,
      color: '#00aa00',
      createdByUserId: user.id,
    },
  });
  return { userId: user.id, geoZoneId: zone.id };
}

function buildTariffCreate(
  geoZoneId: string,
  overrides: Partial<{ name: string }> = {},
): TariffCreate {
  const dto = new TariffCreate();
  dto.name = overrides.name ?? 'Базовый тариф';
  dto.pricePerMinute = 1.5;
  dto.pricePerKm = 10;
  dto.geoZoneId = geoZoneId;
  return dto;
}
