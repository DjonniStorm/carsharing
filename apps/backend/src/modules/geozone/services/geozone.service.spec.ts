import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

import {
  DatabaseGeozoneErrorException,
  GeozoneAlreadyDeletedException,
  GeozoneCreatedByUserIdRequiredException,
  GeozoneNotDeletedException,
  GeozoneNotFoundException,
  GeozoneVersionNotFoundException,
} from '../common/errors';
import { GeozoneVersionCreate } from '../entities/dtos/geozone-version.create';
import type { GeozoneCreate } from '../entities/dtos/geozone.create';
import type { GeozoneRead } from '../entities/dtos/geozone.read';
import { GeozoneUpdate } from '../entities/dtos/geozone.update';
import { GeozoneMapper } from '../common/mapper';
import type { GeoJSONMultiPolygon } from '../entities/geozone.geometry';
import { GeozoneType } from '../entities/geozone.type';
import { GeozoneRepository } from '../repositories/geozone.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestPrismaService,
  loadBackendDevEnv,
  truncateApplicationTable,
} from 'src/shared/testing';
import { GeozoneService } from './geozone.service';

describe('GeozoneService', () => {
  let prisma: PrismaService;
  let repository: GeozoneRepository;
  let service: GeozoneService;
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
        name: `Geozone tester ${suffix.slice(0, 12)}`,
        email: `geozone-${suffix}@test.local`,
        phone: `+79${suffix.replace(/[a-f]/gi, '0').slice(0, 10)}`,
        passwordHash: 'hash',
        role: 0,
        isActive: true,
        isDeleted: false,
      },
    });
    createdByUserId = user.id;

    repository = new GeozoneRepository(prisma);
    service = new GeozoneService(repository);
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

  describe('create', () => {
    it('успешно создаёт зону и первую версию с геометрией и правилами', async () => {
      const dto = buildGeozoneCreate(createdByUserId, {
        name: 'Парковка Центр',
        rules: { maxSpeedKmh: 20 },
      });
      const result = await service.create(dto);
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Парковка Центр');
      expect(result.type).toBe(GeozoneType.RENTAL);
      expect(result.color).toBe('#00aa00');
      expect(result.createdByUserId).toBe(createdByUserId);
      expect(result.deletedAt).toBeNull();
      expect(result.currentVersionId).not.toBeNull();
      expect(result.currentVersion).toBeDefined();
      expect(result.currentVersion?.rules).toEqual({ maxSpeedKmh: 20 });
    });

    it('после создания findById с withCurrentVersion возвращает ту же геометрию', async () => {
      const geometry = sampleMultiPolygonNearLon(0);
      const dto = buildGeozoneCreate(createdByUserId, { geometry });
      const created = await service.create(dto);
      const loaded = await service.findById(created.id, {
        withCurrentVersion: true,
      });
      expect(loaded.currentVersion?.geometry.type).toBe('MultiPolygon');
      expect(loaded.currentVersion?.geometry.coordinates).toHaveLength(
        geometry.coordinates.length,
      );
    });

    it('выбрасывает GeozoneCreatedByUserIdRequiredException если нет createdByUserId', async () => {
      const dto = buildGeozoneCreate(createdByUserId);
      delete (dto as { createdByUserId?: string }).createdByUserId;
      await expect(service.create(dto)).rejects.toThrow(
        GeozoneCreatedByUserIdRequiredException,
      );
    });

    it('выбрасывает GeozoneCreatedByUserIdRequiredException если createdByUserId пустая строка', async () => {
      const dto = buildGeozoneCreate('');
      await expect(service.create(dto)).rejects.toThrow(
        GeozoneCreatedByUserIdRequiredException,
      );
    });

    it('несуществующий createdByUserId приводит к ошибке слоя БД', async () => {
      const dto = buildGeozoneCreate(uuidv4());
      await expect(service.create(dto)).rejects.toThrow(
        DatabaseGeozoneErrorException,
      );
    });
  });

  describe('update', () => {
    it('успешно обновляет имя, тип и цвет', async () => {
      const created = await service.create(
        buildGeozoneCreate(createdByUserId, { name: 'Старое имя' }),
      );
      const patch = new GeozoneUpdate();
      patch.name = 'Новое имя';
      patch.type = GeozoneType.PARKING;
      patch.color = '#112233';
      const updated = await service.update(created.id, patch);
      expect(updated.name).toBe('Новое имя');
      expect(updated.type).toBe(GeozoneType.PARKING);
      expect(updated.color).toBe('#112233');
    });

    it('пустой патч не меняет стабильные поля', async () => {
      const created = await service.create(
        buildGeozoneCreate(createdByUserId, {
          name: 'Без изменений',
          color: '#abcdef',
        }),
      );
      const updated = await service.update(created.id, new GeozoneUpdate());
      expect(updated.name).toBe('Без изменений');
      expect(updated.color).toBe('#abcdef');
    });

    it('выбрасывает GeozoneNotFoundException для несуществующего id', async () => {
      const missingId = uuidv4();
      const patch = new GeozoneUpdate();
      patch.name = 'X';
      await expect(service.update(missingId, patch)).rejects.toThrow(
        GeozoneNotFoundException,
      );
    });

    it('пустой патч для несуществующего id — GeozoneNotFoundException', async () => {
      await expect(
        service.update(uuidv4(), new GeozoneUpdate()),
      ).rejects.toThrow(GeozoneNotFoundException);
    });
  });

  describe('softDelete', () => {
    it('устанавливает deletedAt', async () => {
      const created = await service.create(buildGeozoneCreate(createdByUserId));
      const deleted = await service.softDelete(created.id);
      expect(deleted.deletedAt).not.toBeNull();
    });

    it('выбрасывает GeozoneNotFoundException если зоны нет', async () => {
      await expect(service.softDelete(uuidv4())).rejects.toThrow(
        GeozoneNotFoundException,
      );
    });

    it('выбрасывает GeozoneAlreadyDeletedException при повторном softDelete', async () => {
      const created = await service.create(buildGeozoneCreate(createdByUserId));
      await service.softDelete(created.id);
      await expect(service.softDelete(created.id)).rejects.toThrow(
        GeozoneAlreadyDeletedException,
      );
    });
  });

  describe('restore', () => {
    it('сбрасывает deletedAt после softDelete', async () => {
      const created = await service.create(buildGeozoneCreate(createdByUserId));
      await service.softDelete(created.id);
      const restored = await service.restore(created.id);
      expect(restored.deletedAt).toBeNull();
    });

    it('выбрасывает GeozoneNotFoundException если зоны нет', async () => {
      await expect(service.restore(uuidv4())).rejects.toThrow(
        GeozoneNotFoundException,
      );
    });

    it('выбрасывает GeozoneNotDeletedException если зона не была удалена', async () => {
      const created = await service.create(buildGeozoneCreate(createdByUserId));
      await expect(service.restore(created.id)).rejects.toThrow(
        GeozoneNotDeletedException,
      );
    });
  });

  describe('findById', () => {
    it('возвращает зону по id', async () => {
      const created = await service.create(buildGeozoneCreate(createdByUserId));
      const found = await service.findById(created.id);
      assertGeozoneReadEquals(created, found);
    });

    it('выбрасывает GeozoneNotFoundException для несуществующего id', async () => {
      await expect(service.findById(uuidv4())).rejects.toThrow(
        GeozoneNotFoundException,
      );
    });

    it('с withCurrentVersion подгружает геометрию в currentVersion', async () => {
      const geometry = sampleMultiPolygonNearLon(5);
      const created = await service.create(
        buildGeozoneCreate(createdByUserId, { geometry }),
      );
      const found = await service.findById(created.id, {
        withCurrentVersion: true,
      });
      expect(found.currentVersion).toBeDefined();
      expect(found.currentVersion?.geometry.type).toBe('MultiPolygon');
    });
  });

  describe('findAll', () => {
    it('по умолчанию не возвращает софт-удалённые зоны', async () => {
      const active = await service.create(buildGeozoneCreate(createdByUserId));
      const toDelete = await service.create(
        buildGeozoneCreate(createdByUserId, {
          name: 'Удалим',
          geometry: sampleMultiPolygonNearLon(1),
        }),
      );
      await service.softDelete(toDelete.id);
      const list = await service.findAll();
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(active.id);
    });

    it('с includeDeleted возвращает и удалённые', async () => {
      const active = await service.create(buildGeozoneCreate(createdByUserId));
      const removed = await service.create(
        buildGeozoneCreate(createdByUserId, {
          name: 'Удалённая',
          geometry: sampleMultiPolygonNearLon(2),
        }),
      );
      await service.softDelete(removed.id);
      const list = await service.findAll({ includeDeleted: true });
      const ids = list.map((zone) => zone.id).sort();
      expect(ids).toEqual([active.id, removed.id].sort());
    });

    it('с onlyDeleted возвращает только удалённые', async () => {
      await service.create(buildGeozoneCreate(createdByUserId));
      const removed = await service.create(
        buildGeozoneCreate(createdByUserId, {
          name: 'Только эта в корзине',
          geometry: sampleMultiPolygonNearLon(3),
        }),
      );
      await service.softDelete(removed.id);
      const list = await service.findAll({ onlyDeleted: true });
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(removed.id);
    });

    it('фильтрует по types', async () => {
      await service.create(
        buildGeozoneCreate(createdByUserId, {
          type: GeozoneType.RENTAL,
          geometry: sampleMultiPolygonNearLon(4),
        }),
      );
      await service.create(
        buildGeozoneCreate(createdByUserId, {
          name: 'Парковка',
          type: GeozoneType.PARKING,
          geometry: sampleMultiPolygonNearLon(5),
        }),
      );
      const parkingOnly = await service.findAll({
        types: [GeozoneType.PARKING],
      });
      expect(
        parkingOnly.every((zone) => zone.type === GeozoneType.PARKING),
      ).toBe(true);
      expect(parkingOnly.length).toBe(1);
    });

    it('фильтрует по nameContains без учёта регистра', async () => {
      await service.create(
        buildGeozoneCreate(createdByUserId, {
          name: 'Северный склад',
          geometry: sampleMultiPolygonNearLon(6),
        }),
      );
      await service.create(
        buildGeozoneCreate(createdByUserId, {
          name: 'Другая зона',
          geometry: sampleMultiPolygonNearLon(7),
        }),
      );
      const filtered = await service.findAll({ nameContains: 'север' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Северный склад');
    });

    it('фильтрует по createdByUserId', async () => {
      const suffix = uuidv4().replace(/-/g, '');
      const otherUser = await prisma.user.create({
        data: {
          name: `Other ${suffix.slice(0, 12)}`,
          email: `other-${suffix}@test.local`,
          phone: `+78${suffix.replace(/[a-f]/gi, '1').slice(0, 10)}`,
          passwordHash: 'hash',
          role: 1,
          isActive: true,
          isDeleted: false,
        },
      });
      await service.create(buildGeozoneCreate(createdByUserId));
      await service.create(
        buildGeozoneCreate(otherUser.id, {
          name: 'Чужая зона',
          geometry: sampleMultiPolygonNearLon(8),
        }),
      );
      const mine = await service.findAll({
        createdByUserId: createdByUserId,
      });
      expect(mine.length).toBe(1);
      expect(mine[0].createdByUserId).toBe(createdByUserId);
    });

    it('с withCurrentVersion заполняет currentVersion у каждой зоны', async () => {
      await service.create(buildGeozoneCreate(createdByUserId));
      const list = await service.findAll({ withCurrentVersion: true });
      expect(list.length).toBeGreaterThanOrEqual(1);
      for (const zone of list) {
        if (zone.currentVersionId) {
          expect(zone.currentVersion).toBeDefined();
        }
      }
    });

    it('take ограничивает число записей в ответе', async () => {
      for (let index = 0; index < 3; index++) {
        await service.create(
          buildGeozoneCreate(createdByUserId, {
            name: `Зона-${index}`,
            geometry: sampleMultiPolygonNearLon(100 + index),
          }),
        );
      }
      const page = await service.findAll({ take: 2 });
      expect(page.length).toBe(2);
    });
  });

  describe('publishVersion', () => {
    it('создаёт новую версию и отключает предыдущую', async () => {
      const zone = await service.create(buildGeozoneCreate(createdByUserId));
      const firstVersionId = zone.currentVersionId;
      expect(firstVersionId).not.toBeNull();

      const nextGeometry = sampleMultiPolygonNearLon(20);
      const versionDto = new GeozoneVersionCreate();
      versionDto.geometry = nextGeometry;
      versionDto.rules = { tariff: 'B' };

      const afterPublish = await service.publishVersion(zone.id, versionDto);
      expect(afterPublish.currentVersionId).not.toBe(firstVersionId);

      const history = await service.findVersions(zone.id, {
        includeDisabled: true,
      });
      expect(history.length).toBe(2);
      const disabled = history.find((version) => version.id === firstVersionId);
      expect(disabled?.disabledAt).not.toBeNull();
      const active = history.find(
        (version) => version.id === afterPublish.currentVersionId,
      );
      expect(active?.disabledAt).toBeNull();
    });

    it('выбрасывает GeozoneNotFoundException для несуществующей зоны', async () => {
      const versionDto = new GeozoneVersionCreate();
      versionDto.geometry = sampleMultiPolygonNearLon(0);
      await expect(
        service.publishVersion(uuidv4(), versionDto),
      ).rejects.toThrow(GeozoneNotFoundException);
    });
  });

  describe('findVersions', () => {
    it('по умолчанию возвращает только активную версию', async () => {
      const zone = await service.create(buildGeozoneCreate(createdByUserId));
      const versions = await service.findVersions(zone.id);
      expect(versions.length).toBe(1);
      expect(versions[0].disabledAt).toBeNull();
    });

    it('с includeDisabled возвращает и отключённые после publish', async () => {
      const zone = await service.create(buildGeozoneCreate(createdByUserId));
      const versionDto = new GeozoneVersionCreate();
      versionDto.geometry = sampleMultiPolygonNearLon(30);
      await service.publishVersion(zone.id, versionDto);
      const all = await service.findVersions(zone.id, {
        includeDisabled: true,
      });
      expect(all.length).toBe(2);
    });

    it('для несуществующей зоны — GeozoneNotFoundException', async () => {
      await expect(service.findVersions(uuidv4())).rejects.toThrow(
        GeozoneNotFoundException,
      );
    });
  });

  describe('findVersionById', () => {
    it('возвращает версию по id', async () => {
      const zone = await service.create(buildGeozoneCreate(createdByUserId));
      const versionId = zone.currentVersionId;
      expect(versionId).not.toBeNull();
      const version = await service.findVersionById(versionId!);
      expect(version.geozoneId).toBe(zone.id);
    });

    it('выбрасывает GeozoneVersionNotFoundException для несуществующего id', async () => {
      await expect(service.findVersionById(uuidv4())).rejects.toThrow(
        GeozoneVersionNotFoundException,
      );
    });
  });

  describe('GeozoneMapper (через сервис)', () => {
    it('read → entity → read сохраняет стабильные поля', async () => {
      const created = await service.create(buildGeozoneCreate(createdByUserId));
      const withVersion = await service.findById(created.id, {
        withCurrentVersion: true,
      });
      const entity = GeozoneMapper.toGeozoneEntity(withVersion);
      const roundtrip = GeozoneMapper.toGeozoneRead(
        entity,
        withVersion.currentVersion,
      );
      expect(roundtrip.id).toBe(withVersion.id);
      expect(roundtrip.name).toBe(withVersion.name);
      expect(roundtrip.currentVersionId).toBe(withVersion.currentVersionId);
    });

    it('версия: read → entity → read', async () => {
      const zone = await service.create(buildGeozoneCreate(createdByUserId));
      const version = await service.findVersionById(zone.currentVersionId!);
      const entity = GeozoneMapper.toGeozoneVersionEntity(version);
      const dto = GeozoneMapper.toGeozoneVersionRead(entity);
      expect(dto.id).toBe(version.id);
      expect(dto.geometry.type).toBe(version.geometry.type);
    });

    it('cloneGeozoneRead даёт равную по данным копию', async () => {
      const created = await service.create(buildGeozoneCreate(createdByUserId));
      const full = await service.findById(created.id, {
        withCurrentVersion: true,
      });
      const copy = GeozoneMapper.cloneGeozoneRead(full);
      expect(copy).not.toBe(full);
      expect(copy.id).toBe(full.id);
      expect(copy.currentVersion?.id).toBe(full.currentVersion?.id);
    });
  });

  describe('findInBoundingBox', () => {
    it('возвращает зону если bbox пересекает текущую геометрию', async () => {
      await service.create(buildGeozoneCreate(createdByUserId));
      const bbox = {
        minLon: 29.5,
        minLat: 59.5,
        maxLon: 31.0,
        maxLat: 60.5,
      };
      const zones = await service.findInBoundingBox(bbox);
      expect(zones.length).toBeGreaterThanOrEqual(1);
    });

    it('возвращает пустой массив если bbox не пересекает ни одну зону', async () => {
      await service.create(buildGeozoneCreate(createdByUserId));
      const zones = await service.findInBoundingBox({
        minLon: 0,
        minLat: 0,
        maxLon: 1,
        maxLat: 1,
      });
      expect(zones).toEqual([]);
    });

    it('учитывает фильтр types', async () => {
      await service.create(
        buildGeozoneCreate(createdByUserId, {
          type: GeozoneType.RENTAL,
          geometry: sampleMultiPolygonNearLon(40),
        }),
      );
      const zones = await service.findInBoundingBox({
        minLon: 29,
        minLat: 59,
        maxLon: 32,
        maxLat: 61,
        types: [GeozoneType.PARKING],
      });
      expect(zones.length).toBe(0);
    });
  });

  describe('findContainingPoint', () => {
    it('возвращает зону если точка внутри текущей геометрии', async () => {
      await service.create(buildGeozoneCreate(createdByUserId));
      const zones = await service.findContainingPoint({
        lon: 30.15,
        lat: 59.975,
      });
      expect(zones.length).toBeGreaterThanOrEqual(1);
    });

    it('возвращает пустой массив если точка снаружи', async () => {
      await service.create(buildGeozoneCreate(createdByUserId));
      const zones = await service.findContainingPoint({
        lon: 0,
        lat: 0,
      });
      expect(zones).toEqual([]);
    });

    it('учитывает фильтр types', async () => {
      const lonOffset = 50;
      await service.create(
        buildGeozoneCreate(createdByUserId, {
          type: GeozoneType.RENTAL,
          geometry: sampleMultiPolygonNearLon(lonOffset),
        }),
      );
      const baseLon = 30 + lonOffset * 0.01;
      const interiorLon = baseLon + 0.1;
      const interiorLat = 59.975;
      const zones = await service.findContainingPoint({
        lon: interiorLon,
        lat: interiorLat,
        types: [GeozoneType.PARKING],
      });
      expect(zones.length).toBe(0);
    });
  });
});

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

const buildGeozoneCreate = (
  userId: string,
  overrides: Partial<{
    name: string;
    type: GeozoneType;
    color: string;
    geometry: GeoJSONMultiPolygon;
    rules: Record<string, unknown> | null;
  }> = {},
): GeozoneCreate => {
  const geometry = overrides.geometry ?? sampleMultiPolygonNearLon(0);
  return {
    name: overrides.name ?? 'Тестовая зона',
    type: overrides.type ?? GeozoneType.RENTAL,
    color: overrides.color ?? '#00aa00',
    geometry,
    rules: overrides.rules !== undefined ? overrides.rules : null,
    createdByUserId: userId,
  } as GeozoneCreate;
};

const assertGeozoneReadEquals = (
  expected: GeozoneRead,
  actual: GeozoneRead,
) => {
  expect(actual.id).toBe(expected.id);
  expect(actual.name).toBe(expected.name);
  expect(actual.type).toBe(expected.type);
  expect(actual.color).toBe(expected.color);
  expect(actual.createdByUserId).toBe(expected.createdByUserId);
};
