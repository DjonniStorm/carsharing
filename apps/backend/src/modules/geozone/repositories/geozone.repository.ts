import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { GeozoneDbErrors } from '../common/db-errors';
import {
  GeozoneGeometryMissingException,
  GeozoneNotFoundException,
} from '../common/errors';
import type { GeoJSONMultiPolygon } from '../entities/geozone.geometry';
import type {
  GeozoneBoundingBoxParams,
  GeozoneContainingPointParams,
  GeozoneFindByIdOptions,
  GeozoneListParams,
  GeozoneVersionListFilters,
} from '../entities/geozone-query.types';
import { GeozoneType } from '../entities/geozone.type';
import type { GeozoneVersionRead } from '../entities/dtos/geozone-version.read';
import type { GeozoneRead } from '../entities/dtos/geozone.read';
import { PrismaService } from 'src/prisma/prisma.service';
import { IGeozoneRepository } from './geozone.repository.interface';

@Injectable()
export class GeozoneRepository implements IGeozoneRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Возвращает список зон с учётом фильтров, пагинации и опциональной подгрузки
   * геометрии текущей версии.
   */
  async findMany(params?: GeozoneListParams): Promise<GeozoneRead[]> {
    const zoneRows = await this.prisma.geoZone.findMany({
      where: this.buildListWhere(params),
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
    const reads = zoneRows.map((zoneRow) => this.zoneRowToRead(zoneRow));
    if (params?.withCurrentVersion) {
      await this.attachCurrentVersions(reads);
    }
    return reads;
  }

  /**
   * Загружает зоны по списку id (порядок не гарантируется как в запросе —
   * сортируется по `createdAt` desc).
   */
  async findByIds(
    zoneIds: string[],
    withCurrentVersion: boolean,
  ): Promise<GeozoneRead[]> {
    if (zoneIds.length === 0) {
      return [];
    }
    const zoneRows = await this.prisma.geoZone.findMany({
      where: { id: { in: zoneIds } },
      orderBy: { createdAt: 'desc' },
    });
    const reads = zoneRows.map((zoneRow) => this.zoneRowToRead(zoneRow));
    if (withCurrentVersion) {
      await this.attachCurrentVersions(reads);
    }
    return reads;
  }

  /** Возвращает зону по id или `null`, если записи нет. */
  async findById(
    id: string,
    options?: GeozoneFindByIdOptions,
  ): Promise<GeozoneRead | null> {
    const zoneRow = await this.prisma.geoZone.findUnique({ where: { id } });
    if (!zoneRow) {
      return null;
    }
    const read = this.zoneRowToRead(zoneRow);
    if (options?.withCurrentVersion) {
      await this.attachCurrentVersions([read]);
    }
    return read;
  }

  /**
   * Создаёт зону без `current_version_id`, вставляет первую версию через PostGIS
   * и обновляет ссылку на текущую версию.
   */
  async createWithInitialVersion(input: {
    name: string;
    type: string;
    color: string;
    createdByUserId: string;
    geometry: GeoJSONMultiPolygon;
    rules: Record<string, unknown> | null | undefined;
    pricePerMinute: number;
    pricePerKm: number;
    pausePricePerMinute: number;
  }): Promise<GeozoneRead> {
    const zoneId = randomUUID();
    const versionId = randomUUID();
    const rulesJson =
      input.rules === undefined || input.rules === null
        ? null
        : JSON.stringify(input.rules);
    const geometryJson = JSON.stringify(input.geometry);

    try {
      await this.prisma.$transaction(async (prismaTx) => {
        await prismaTx.geoZone.create({
          data: {
            id: zoneId,
            name: input.name,
            type: input.type,
            color: input.color,
            createdByUserId: input.createdByUserId,
            currentVersionId: null,
          },
        });
        await prismaTx.$executeRawUnsafe(
          `INSERT INTO geo_zone_version (id, geozone_id, geometry, rules, created_at, disabled_at, price_per_minute, price_per_km, pause_price_per_minute)
           VALUES ($1::uuid, $2::uuid, ST_SetSRID(ST_GeomFromGeoJSON($3::json), 4326), $4::jsonb, NOW(), NULL, $5::numeric, $6::numeric, $7::numeric)`,
          versionId,
          zoneId,
          geometryJson,
          rulesJson,
          input.pricePerMinute,
          input.pricePerKm,
          input.pausePricePerMinute,
        );
        await prismaTx.geoZone.update({
          where: { id: zoneId },
          data: { currentVersionId: versionId },
        });
      });
    } catch (error) {
      throw GeozoneDbErrors.mapError(error);
    }

    const createdRow = await this.prisma.geoZone.findUniqueOrThrow({
      where: { id: zoneId },
    });
    const read = this.zoneRowToRead(createdRow);
    await this.attachCurrentVersions([read]);
    return read;
  }

  /**
   * Обновляет только переданные поля. Пустой патч — чтение без изменений.
   * Если зона не найдена — `GeozoneNotFoundException`.
   */
  async updateZone(
    id: string,
    patch: Partial<{ name: string; type: string; color: string }>,
  ): Promise<GeozoneRead> {
    if (Object.keys(patch).length === 0) {
      const zoneRow = await this.prisma.geoZone.findUnique({
        where: { id },
      });
      if (!zoneRow) {
        throw new GeozoneNotFoundException(`Геозона не найдена: ${id}`);
      }
      const read = this.zoneRowToRead(zoneRow);
      await this.attachCurrentVersions([read]);
      return read;
    }

    try {
      const updatedRow = await this.prisma.geoZone.update({
        where: { id },
        data: patch,
      });
      const read = this.zoneRowToRead(updatedRow);
      await this.attachCurrentVersions([read]);
      return read;
    } catch (error) {
      throw GeozoneDbErrors.mapError(error);
    }
  }

  /** Устанавливает или сбрасывает `deleted_at`. */
  async setDeletedAt(id: string, deletedAt: Date | null): Promise<GeozoneRead> {
    try {
      const updatedRow = await this.prisma.geoZone.update({
        where: { id },
        data: { deletedAt },
      });
      const read = this.zoneRowToRead(updatedRow);
      await this.attachCurrentVersions([read]);
      return read;
    } catch (error) {
      throw GeozoneDbErrors.mapError(error);
    }
  }

  /**
   * Публикует новую версию: помечает предыдущую текущую как отключённую,
   * вставляет новую строку версии и обновляет `current_version_id`.
   */
  async publishNewVersion(
    geozoneId: string,
    input: {
      geometry: GeoJSONMultiPolygon;
      rules: Record<string, unknown> | null | undefined;
      pricePerMinute: number;
      pricePerKm: number;
      pausePricePerMinute: number;
    },
  ): Promise<GeozoneRead> {
    const versionId = randomUUID();
    const rulesJson =
      input.rules === undefined || input.rules === null
        ? null
        : JSON.stringify(input.rules);
    const geometryJson = JSON.stringify(input.geometry);

    try {
      await this.prisma.$transaction(async (prismaTx) => {
        const zoneRow = await prismaTx.geoZone.findUnique({
          where: { id: geozoneId },
        });
        if (!zoneRow) {
          throw new GeozoneNotFoundException(
            `Геозона не найдена: ${geozoneId}`,
          );
        }
        if (zoneRow.currentVersionId) {
          await prismaTx.geoZoneVersion.update({
            where: { id: zoneRow.currentVersionId },
            data: { disabledAt: new Date() },
          });
        }
        await prismaTx.$executeRawUnsafe(
          `INSERT INTO geo_zone_version (id, geozone_id, geometry, rules, created_at, disabled_at, price_per_minute, price_per_km, pause_price_per_minute)
           VALUES ($1::uuid, $2::uuid, ST_SetSRID(ST_GeomFromGeoJSON($3::json), 4326), $4::jsonb, NOW(), NULL, $5::numeric, $6::numeric, $7::numeric)`,
          versionId,
          geozoneId,
          geometryJson,
          rulesJson,
          input.pricePerMinute,
          input.pricePerKm,
          input.pausePricePerMinute,
        );
        await prismaTx.geoZone.update({
          where: { id: geozoneId },
          data: { currentVersionId: versionId },
        });
      });
    } catch (error) {
      if (error instanceof GeozoneNotFoundException) {
        throw error;
      }
      throw GeozoneDbErrors.mapError(error);
    }

    const updatedRow = await this.prisma.geoZone.findUniqueOrThrow({
      where: { id: geozoneId },
    });
    const read = this.zoneRowToRead(updatedRow);
    await this.attachCurrentVersions([read]);
    return read;
  }

  /**
   * Список версий зоны. По умолчанию только с `disabled_at IS NULL`;
   * при `includeDisabled` возвращаются и отключённые версии.
   */
  async findVersions(
    geozoneId: string,
    filters?: GeozoneVersionListFilters,
  ): Promise<GeozoneVersionRead[]> {
    const versionRows = await this.prisma.geoZoneVersion.findMany({
      where: {
        geozoneId,
        ...(filters?.includeDisabled ? {} : { disabledAt: null }),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        geozoneId: true,
        rules: true,
        pricePerMinute: true,
        pricePerKm: true,
        pausePricePerMinute: true,
        createdAt: true,
        disabledAt: true,
      },
    });
    const geometryByVersionId = await this.geometryByVersionIds(
      versionRows.map((row) => row.id),
    );
    return versionRows.map((versionRow) => {
      const geometryValue = geometryByVersionId.get(versionRow.id);
      if (!geometryValue) {
        throw new GeozoneGeometryMissingException(
          `Нет геометрии для версии ${versionRow.id}`,
        );
      }
      return this.versionMetaToRead(versionRow, geometryValue);
    });
  }

  /** Версия по id с геометрией из PostGIS или `null`. */
  async findVersionById(versionId: string): Promise<GeozoneVersionRead | null> {
    const versionRow = await this.prisma.geoZoneVersion.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        geozoneId: true,
        rules: true,
        pricePerMinute: true,
        pricePerKm: true,
        pausePricePerMinute: true,
        createdAt: true,
        disabledAt: true,
      },
    });
    if (!versionRow) {
      return null;
    }
    const geometryByVersionId = await this.geometryByVersionIds([versionId]);
    const geometryValue = geometryByVersionId.get(versionId);
    if (!geometryValue) {
      return null;
    }
    return this.versionMetaToRead(versionRow, geometryValue);
  }

  /** Id зон, пересекающих bbox по текущей версии. */
  async findIdsInBoundingBox(
    params: GeozoneBoundingBoxParams,
  ): Promise<string[]> {
    const { minLon, minLat, maxLon, maxLat, includeDeleted, types } = params;
    const deletedClause = includeDeleted ? '' : 'AND gz.deleted_at IS NULL';
    const typeValues = types?.filter((zoneType) =>
      Object.values(GeozoneType).includes(zoneType),
    );
    const typeClause =
      typeValues && typeValues.length > 0
        ? `AND gz.type IN (${typeValues
            .map((unused, index) => `$${5 + index}`)
            .join(', ')})`
        : '';
    const sql = `
      SELECT DISTINCT gz.id
      FROM geo_zone gz
      INNER JOIN geo_zone_version gzv ON gz.current_version_id = gzv.id
      WHERE ST_Intersects(
        gzv.geometry,
        ST_MakeEnvelope($1::float8, $2::float8, $3::float8, $4::float8, 4326)
      )
      ${deletedClause}
      ${typeClause}
    `;
    const queryArgs: unknown[] = [minLon, minLat, maxLon, maxLat];
    if (typeValues && typeValues.length > 0) {
      queryArgs.push(...typeValues);
    }
    const idRows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      sql,
      ...queryArgs,
    );
    return idRows.map((row) => row.id);
  }

  /** Id зон, содержащих точку по текущей версии. */
  async findIdsContainingPoint(
    params: GeozoneContainingPointParams,
  ): Promise<string[]> {
    const { lon, lat, includeDeleted, types } = params;
    const deletedClause = includeDeleted ? '' : 'AND gz.deleted_at IS NULL';
    const typeValues = types?.filter((zoneType) =>
      Object.values(GeozoneType).includes(zoneType),
    );
    const typeClause =
      typeValues && typeValues.length > 0
        ? `AND gz.type IN (${typeValues
            .map((unused, index) => `$${3 + index}`)
            .join(', ')})`
        : '';
    const sql = `
      SELECT DISTINCT gz.id
      FROM geo_zone gz
      INNER JOIN geo_zone_version gzv ON gz.current_version_id = gzv.id
      WHERE ST_Contains(
        gzv.geometry,
        ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)
      )
      ${deletedClause}
      ${typeClause}
    `;
    const queryArgs: unknown[] = [lon, lat];
    if (typeValues && typeValues.length > 0) {
      queryArgs.push(...typeValues);
    }
    const idRows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      sql,
      ...queryArgs,
    );
    return idRows.map((row) => row.id);
  }

  /** Собирает `where` для списка зон из query-параметров. */
  private buildListWhere(params?: GeozoneListParams): Prisma.GeoZoneWhereInput {
    const listParams = params ?? {};
    const {
      onlyDeleted,
      includeDeleted,
      types,
      nameContains,
      createdByUserId,
    } = listParams;
    const geoZoneWhere: Prisma.GeoZoneWhereInput = {};

    if (onlyDeleted) {
      geoZoneWhere.deletedAt = { not: null };
    } else if (!includeDeleted) {
      geoZoneWhere.deletedAt = null;
    }

    if (types && types.length > 0) {
      geoZoneWhere.type = { in: types };
    }
    if (nameContains) {
      geoZoneWhere.name = { contains: nameContains, mode: 'insensitive' };
    }
    if (createdByUserId) {
      geoZoneWhere.createdByUserId = createdByUserId;
    }
    return geoZoneWhere;
  }

  /** Маппинг строки Prisma в DTO чтения зоны (без вложенной версии). */
  private zoneRowToRead(zoneRow: {
    id: string;
    name: string;
    type: string;
    color: string;
    currentVersionId: string | null;
    createdAt: Date;
    deletedAt: Date | null;
    createdByUserId: string;
  }): GeozoneRead {
    return {
      id: zoneRow.id,
      name: zoneRow.name,
      type: zoneRow.type as GeozoneType,
      color: zoneRow.color,
      currentVersionId: zoneRow.currentVersionId,
      createdAt: zoneRow.createdAt,
      deletedAt: zoneRow.deletedAt,
      createdByUserId: zoneRow.createdByUserId,
    };
  }

  /** Сборка DTO версии из метаданных и уже загруженной GeoJSON-геометрии. */
  private versionMetaToRead(
    versionMeta: {
      id: string;
      geozoneId: string;
      rules: Prisma.JsonValue;
      pricePerMinute: Prisma.Decimal | number;
      pricePerKm: Prisma.Decimal | number;
      pausePricePerMinute: Prisma.Decimal | number;
      createdAt: Date;
      disabledAt: Date | null;
    },
    geometry: GeoJSONMultiPolygon,
  ): GeozoneVersionRead {
    return {
      id: versionMeta.id,
      geozoneId: versionMeta.geozoneId,
      geometry,
      rules:
        versionMeta.rules === null
          ? null
          : (versionMeta.rules as Record<string, unknown>),
      pricePerMinute: GeozoneRepository.decimalToNumber(versionMeta.pricePerMinute),
      pricePerKm: GeozoneRepository.decimalToNumber(versionMeta.pricePerKm),
      pausePricePerMinute: GeozoneRepository.decimalToNumber(
        versionMeta.pausePricePerMinute,
      ),
      createdAt: versionMeta.createdAt,
      disabledAt: versionMeta.disabledAt,
    };
  }

  private static decimalToNumber(value: Prisma.Decimal | number): number {
    return typeof value === 'number' ? value : value.toNumber();
  }

  /**
   * Пакетно читает геометрию версий как GeoJSON (ST_AsGeoJSON),
   * чтобы не зависеть от типа `Unsupported` в Prisma Client.
   */
  private async geometryByVersionIds(
    versionIds: string[],
  ): Promise<Map<string, GeoJSONMultiPolygon>> {
    const resultMap = new Map<string, GeoJSONMultiPolygon>();
    if (versionIds.length === 0) {
      return resultMap;
    }
    const placeholders = versionIds
      .map((_, index) => `$${index + 1}::uuid`)
      .join(', ');
    const sql = `
      SELECT id, ST_AsGeoJSON(geometry)::json AS geojson
      FROM geo_zone_version
      WHERE id IN (${placeholders})
    `;
    const geometryRows = await this.prisma.$queryRawUnsafe<
      { id: string; geojson: unknown }[]
    >(sql, ...versionIds);
    for (const geometryRow of geometryRows) {
      resultMap.set(geometryRow.id, geometryRow.geojson as GeoJSONMultiPolygon);
    }
    return resultMap;
  }

  /**
   * Для каждой зоны с непустым `currentVersionId` подставляет объект
   * `currentVersion` с геометрией и правилами.
   */
  private async attachCurrentVersions(reads: GeozoneRead[]): Promise<void> {
    const versionIds = reads
      .map((zoneRead) => zoneRead.currentVersionId)
      .filter((versionId): versionId is string => versionId != null);
    if (versionIds.length === 0) {
      return;
    }
    const [geometryByVersionId, versionMetas] = await Promise.all([
      this.geometryByVersionIds(versionIds),
      this.prisma.geoZoneVersion.findMany({
        where: { id: { in: versionIds } },
        select: {
          id: true,
          geozoneId: true,
          rules: true,
          pricePerMinute: true,
          pricePerKm: true,
          pausePricePerMinute: true,
          createdAt: true,
          disabledAt: true,
        },
      }),
    ]);
    const metaById = new Map(
      versionMetas.map((versionMeta) => [versionMeta.id, versionMeta]),
    );
    for (const zoneRead of reads) {
      if (!zoneRead.currentVersionId) {
        continue;
      }
      const versionMeta = metaById.get(zoneRead.currentVersionId);
      const geometryValue = geometryByVersionId.get(zoneRead.currentVersionId);
      if (versionMeta && geometryValue) {
        zoneRead.currentVersion = this.versionMetaToRead(
          versionMeta,
          geometryValue,
        );
      }
    }
  }
}
