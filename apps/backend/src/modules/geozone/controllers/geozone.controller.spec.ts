import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import { GeozoneCreate } from '../entities/dtos/geozone.create';
import { GeozoneUpdate } from '../entities/dtos/geozone.update';
import { GeozoneVersionCreate } from '../entities/dtos/geozone-version.create';
import type { GeoJSONMultiPolygon } from '../entities/geozone.geometry';
import { GeozoneType } from '../entities/geozone.type';
import { GeozoneRepository } from '../repositories/geozone.repository';
import { GeozoneService } from '../services/geozone.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { GeozoneController } from './geozone.controller';

describe('GeozoneController', () => {
  let prisma: PrismaService;
  let repository: GeozoneRepository;
  let service: GeozoneService;
  let controller: GeozoneController;
  let createdByUserId: string;

  beforeEach(async () => {
    loadBackendDevEnv();
    prisma = createTestPrismaService();
    await prisma.$connect();
    await truncateApplicationTable(prisma, 'geo_zone_version');
    await truncateApplicationTable(prisma, 'geo_zone');
    await truncateApplicationTable(prisma, 'user');

    const suffix = uuidv4().replace(/-/g, '');
    const user = await prisma.user.create({
      data: {
        name: `Geozone ctrl ${suffix.slice(0, 12)}`,
        email: `geozone-ctrl-${suffix}@test.local`,
        phone: `+76${suffix.replace(/[a-f]/gi, '3').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    createdByUserId = user.id;

    repository = new GeozoneRepository(prisma);
    service = new GeozoneService(repository);
    controller = new GeozoneController(service);
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

  describe('findAll', () => {
    it('возвращает пустой список', async () => {
      const list = await controller.findAll(false);
      expect(list).toEqual([]);
    });

    it('возвращает зоны и учитывает includeDeleted', async () => {
      const dto = buildGeozoneCreate(createdByUserId);
      const created = await controller.create(dto);
      const active = await controller.findAll(false);
      expect(active.some((z) => z.id === created.id)).toBe(true);

      await controller.softDelete(created.id);
      const withoutDeleted = await controller.findAll(false);
      expect(withoutDeleted.some((z) => z.id === created.id)).toBe(false);

      const withDeleted = await controller.findAll(true);
      expect(withDeleted.some((z) => z.id === created.id)).toBe(true);
    });
  });

  describe('findById', () => {
    it('возвращает зону', async () => {
      const dto = buildGeozoneCreate(createdByUserId);
      const created = await controller.create(dto);
      const found = await controller.findById(created.id);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe(dto.name);
    });

    it('NotFound если зоны нет', async () => {
      await expect(controller.findById(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('создаёт зону с createdByUserId в теле', async () => {
      const dto = buildGeozoneCreate(createdByUserId);
      const result = await controller.create(dto);
      expect(result.createdByUserId).toBe(createdByUserId);
      expect(result.currentVersionId).not.toBeNull();
    });

    it('подставляет createdByUserId из query, если в теле нет (контекста пока нет)', async () => {
      const dto = buildGeozoneCreate(undefined);
      const result = await controller.create(dto, createdByUserId);
      expect(result.createdByUserId).toBe(createdByUserId);
    });

    it('BadRequest если нет ни в теле, ни в query', async () => {
      const dto = buildGeozoneCreate(undefined);
      await expect(controller.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('обновляет поля', async () => {
      const created = await controller.create(
        buildGeozoneCreate(createdByUserId),
      );
      const patch = new GeozoneUpdate();
      patch.name = 'Новое имя';
      patch.type = GeozoneType.PARKING;
      const updated = await controller.update(created.id, patch);
      expect(updated.name).toBe('Новое имя');
      expect(updated.type).toBe(GeozoneType.PARKING);
    });

    it('NotFound для несуществующего id', async () => {
      await expect(
        controller.update(uuidv4(), new GeozoneUpdate()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('помечает удалённой', async () => {
      const created = await controller.create(
        buildGeozoneCreate(createdByUserId),
      );
      const deleted = await controller.softDelete(created.id);
      expect(deleted.deletedAt).not.toBeNull();
    });

    it('NotFound если зоны нет', async () => {
      await expect(controller.softDelete(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Conflict при повторном удалении', async () => {
      const created = await controller.create(
        buildGeozoneCreate(createdByUserId),
      );
      await controller.softDelete(created.id);
      await expect(controller.softDelete(created.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('restore', () => {
    it('снимает удаление', async () => {
      const created = await controller.create(
        buildGeozoneCreate(createdByUserId),
      );
      await controller.softDelete(created.id);
      const restored = await controller.restore(created.id);
      expect(restored.deletedAt).toBeNull();
    });

    it('Conflict если зона не была удалена', async () => {
      const created = await controller.create(
        buildGeozoneCreate(createdByUserId),
      );
      await expect(controller.restore(created.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('publishVersion', () => {
    it('публикует новую версию', async () => {
      const zone = await controller.create(buildGeozoneCreate(createdByUserId));
      const prev = zone.currentVersionId;
      const ver = new GeozoneVersionCreate();
      ver.geometry = sampleMultiPolygonNearLon(99);
      ver.rules = { t: 1 };
      ver.pricePerMinute = 1.5;
      ver.pricePerKm = 10;
      ver.pausePricePerMinute = 0.25;
      const after = await controller.publishVersion(zone.id, ver);
      expect(after.currentVersionId).not.toBe(prev);
    });

    it('NotFound для несуществующей зоны', async () => {
      const ver = new GeozoneVersionCreate();
      ver.geometry = sampleMultiPolygonNearLon(0);
      ver.pricePerMinute = 1;
      ver.pricePerKm = 1;
      ver.pausePricePerMinute = 1;
      await expect(controller.publishVersion(uuidv4(), ver)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findVersions', () => {
    it('возвращает версии', async () => {
      const zone = await controller.create(buildGeozoneCreate(createdByUserId));
      const list = await controller.findVersions(zone.id);
      expect(list.length).toBe(1);
    });

    it('NotFound если зоны нет', async () => {
      await expect(controller.findVersions(uuidv4())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findVersionById', () => {
    it('возвращает версию при совпадении geozone id', async () => {
      const zone = await controller.create(buildGeozoneCreate(createdByUserId));
      const v = await controller.findVersionById(
        zone.id,
        zone.currentVersionId!,
      );
      expect(v.geozoneId).toBe(zone.id);
    });

    it('NotFound если версия от другой зоны', async () => {
      const a = await controller.create(buildGeozoneCreate(createdByUserId));
      const b = await controller.create(
        buildGeozoneCreate(createdByUserId, { name: 'B' }),
      );
      await expect(
        controller.findVersionById(b.id, a.currentVersionId!),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findInBoundingBox', () => {
    it('находит зону в прямоугольнике', async () => {
      await controller.create(buildGeozoneCreate(createdByUserId));
      const list = await controller.findInBoundingBox(
        29,
        59.5,
        31,
        60.5,
        false,
        '',
      );
      expect(list.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findContainingPoint', () => {
    it('находит зону по точке внутри', async () => {
      await controller.create(buildGeozoneCreate(createdByUserId));
      const list = await controller.findContainingPoint(
        30.15,
        59.975,
        false,
        '',
      );
      expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it('фильтр types в строке исключает несовпадающий тип', async () => {
      await controller.create(
        buildGeozoneCreate(createdByUserId, { type: GeozoneType.RENTAL }),
      );
      const list = await controller.findContainingPoint(
        30.15,
        59.975,
        false,
        GeozoneType.PARKING,
      );
      expect(list.length).toBe(0);
    });
  });
});

function buildGeozoneCreate(
  createdByUserId: string | undefined,
  overrides: Partial<{ name: string; type: GeozoneType }> = {},
): GeozoneCreate {
  const dto = new GeozoneCreate();
  dto.name = overrides.name ?? 'Зона ctrl';
  dto.type = overrides.type ?? GeozoneType.RENTAL;
  dto.color = '#00aa00';
  dto.geometry = sampleMultiPolygonNearLon(0);
  dto.rules = null;
  dto.pricePerMinute = 1.5;
  dto.pricePerKm = 10;
  dto.pausePricePerMinute = 0.25;
  if (createdByUserId !== undefined) {
    dto.createdByUserId = createdByUserId;
  }
  return dto;
}

const sampleMultiPolygonNearLon = (lonOffset: number): GeoJSONMultiPolygon => {
  const baseLon = 30 + lonOffset * 0.01;
  return {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [baseLon, 59.9],
          [baseLon + 0.2, 59.9],
          [baseLon + 0.2, 60.05],
          [baseLon, 60.05],
          [baseLon, 59.9],
        ],
      ],
    ],
  } as unknown as GeoJSONMultiPolygon;
};
