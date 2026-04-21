import { GeozoneCreate } from '../entities/dtos/geozone.create';
import { GeozoneRead } from '../entities/dtos/geozone.read';
import { GeozoneUpdate } from '../entities/dtos/geozone.update';
import { GeozoneVersionRead } from '../entities/dtos/geozone-version.read';
import { GeozoneEntity } from '../entities/geozone.entity';
import type { GeoJSONMultiPolygon } from '../entities/geozone.geometry';
import { GeozoneVersionEntity } from '../entities/geozone-version.entity';

export type GeozoneCreateRepositoryInput = {
  name: string;
  type: string;
  color: string;
  createdByUserId: string;
  geometry: GeoJSONMultiPolygon;
  rules: Record<string, unknown> | null | undefined;
  pricePerMinute: number;
  pricePerKm: number;
  pausePricePerMinute: number;
};

export class GeozoneMapper {
  static toCreateRepositoryInput(
    dto: GeozoneCreate,
    createdByUserId: string,
  ): GeozoneCreateRepositoryInput {
    return {
      name: dto.name,
      type: dto.type,
      color: dto.color,
      createdByUserId,
      geometry: dto.geometry,
      rules: dto.rules ?? null,
      pricePerMinute: dto.pricePerMinute,
      pricePerKm: dto.pricePerKm,
      pausePricePerMinute: dto.pausePricePerMinute,
    };
  }

  static toUpdatePatch(
    dto: GeozoneUpdate,
  ): Partial<{ name: string; type: string; color: string }> {
    const patch: Partial<{ name: string; type: string; color: string }> = {};
    if (dto.name !== undefined) {
      patch.name = dto.name;
    }
    if (dto.type !== undefined) {
      patch.type = dto.type;
    }
    if (dto.color !== undefined) {
      patch.color = dto.color;
    }
    return patch;
  }

  static toGeozoneEntity(read: GeozoneRead): GeozoneEntity {
    if (read.currentVersionId == null) {
      throw new Error(
        'GeozoneRead.currentVersionId обязателен для маппинга в GeozoneEntity',
      );
    }
    return new GeozoneEntity(
      read.id,
      read.name,
      read.type,
      read.color,
      read.currentVersionId,
      read.createdAt,
      read.deletedAt,
      read.createdByUserId,
    );
  }

  static toGeozoneRead(
    entity: GeozoneEntity,
    currentVersion?: GeozoneVersionRead,
  ): GeozoneRead {
    const dto = new GeozoneRead();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.type = entity.type;
    dto.color = entity.color;
    dto.currentVersionId = entity.currentVersionId;
    dto.createdAt = entity.createdAt;
    dto.deletedAt = entity.deletedAt;
    dto.createdByUserId = entity.createdByUserId;
    dto.currentVersion = currentVersion;
    return dto;
  }

  static toGeozoneVersionEntity(dto: GeozoneVersionRead): GeozoneVersionEntity {
    return new GeozoneVersionEntity(
      dto.id,
      dto.geozoneId,
      dto.geometry,
      dto.rules,
      dto.pricePerMinute,
      dto.pricePerKm,
      dto.pausePricePerMinute,
      dto.createdAt,
      dto.disabledAt,
    );
  }

  static toGeozoneVersionRead(
    entity: GeozoneVersionEntity,
  ): GeozoneVersionRead {
    const dto = new GeozoneVersionRead();
    dto.id = entity.id;
    dto.geozoneId = entity.geozoneId;
    dto.geometry = entity.geometry;
    dto.rules = entity.rules;
    dto.pricePerMinute = entity.pricePerMinute;
    dto.pricePerKm = entity.pricePerKm;
    dto.pausePricePerMinute = entity.pausePricePerMinute;
    dto.createdAt = entity.createdAt;
    dto.disabledAt = entity.disabledAt;
    return dto;
  }

  static cloneGeozoneRead(read: GeozoneRead): GeozoneRead {
    const copy = new GeozoneRead();
    copy.id = read.id;
    copy.name = read.name;
    copy.type = read.type;
    copy.color = read.color;
    copy.currentVersionId = read.currentVersionId;
    copy.createdAt = read.createdAt;
    copy.deletedAt = read.deletedAt;
    copy.createdByUserId = read.createdByUserId;
    if (read.currentVersion) {
      copy.currentVersion = GeozoneMapper.cloneGeozoneVersionRead(
        read.currentVersion,
      );
    }
    return copy;
  }

  static cloneGeozoneVersionRead(
    version: GeozoneVersionRead,
  ): GeozoneVersionRead {
    const copy = new GeozoneVersionRead();
    copy.id = version.id;
    copy.geozoneId = version.geozoneId;
    copy.geometry = structuredClone(version.geometry);
    copy.rules =
      version.rules === null
        ? null
        : (JSON.parse(JSON.stringify(version.rules)) as Record<string, unknown>);
    copy.pricePerMinute = version.pricePerMinute;
    copy.pricePerKm = version.pricePerKm;
    copy.pausePricePerMinute = version.pausePricePerMinute;
    copy.createdAt = version.createdAt;
    copy.disabledAt = version.disabledAt;
    return copy;
  }
}
