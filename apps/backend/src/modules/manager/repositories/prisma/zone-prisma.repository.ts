import { Injectable } from '@nestjs/common';
import {
  CreateZoneInput,
  UpdateZoneInput,
  ZoneEntity,
} from '../../../../shared/types/repository.types';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ZoneRepository } from '../zone.repository';

@Injectable()
export class ZonePrismaRepository implements ZoneRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ZoneEntity[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; name: string; type: string; geometry: string }>
    >`
      SELECT id, name, type, ST_AsGeoJSON(polygon)::text AS geometry
      FROM geo_zone
      WHERE name NOT LIKE '__deleted__:%'
      ORDER BY id
    `;
    return rows.map((row) => this.toZoneEntity(row));
  }

  async findActive(): Promise<ZoneEntity[]> {
    return this.findAll();
  }

  async findById(id: number): Promise<ZoneEntity | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; name: string; type: string; geometry: string }>
    >`
      SELECT id, name, type, ST_AsGeoJSON(polygon)::text AS geometry
      FROM geo_zone
      WHERE id = ${id}
      LIMIT 1
    `;
    return rows[0] ? this.toZoneEntity(rows[0]) : null;
  }

  async create(data: CreateZoneInput): Promise<ZoneEntity> {
    const geometryJson = JSON.stringify(data.geometry);
    const [row] = await this.prisma.$queryRaw<
      Array<{ id: number; name: string; type: string; geometry: string }>
    >`
      INSERT INTO geo_zone (name, type, polygon)
      VALUES (${data.name}, ${data.type}, ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326))
      RETURNING id, name, type, ST_AsGeoJSON(polygon)::text as geometry
    `;
    if (data.isActive === false) {
      await this.softDelete(row.id);
      const created = await this.findById(row.id);
      if (!created) {
        throw new Error('Zone create failed');
      }
      return created;
    }
    return this.toZoneEntity(row);
  }

  async update(id: number, data: UpdateZoneInput): Promise<ZoneEntity> {
    const current = await this.findById(id);
    if (!current) {
      throw new Error(`Zone ${id} not found`);
    }
    if (data.geometry) {
      const geometryJson = JSON.stringify(data.geometry);
      await this.prisma.$executeRaw`
        UPDATE geo_zone
        SET polygon = ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326)
        WHERE id = ${id}
      `;
    }
    await this.prisma.$executeRaw`
      UPDATE geo_zone
      SET name = COALESCE(${data.name ?? null}, name),
          type = COALESCE(${data.type ?? null}, type)
      WHERE id = ${id}
    `;
    if (data.isActive === false) {
      await this.prisma.$executeRaw`
        UPDATE geo_zone
        SET name = CONCAT('__deleted__:', name)
        WHERE id = ${id} AND name NOT LIKE '__deleted__:%'
      `;
    }
    if (data.isActive === true) {
      await this.prisma.$executeRaw`
        UPDATE geo_zone
        SET name = REGEXP_REPLACE(name, '^__deleted__:', '')
        WHERE id = ${id}
      `;
    }
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Zone ${id} not found`);
    }
    return updated;
  }

  async softDelete(id: number): Promise<ZoneEntity> {
    return this.update(id, { isActive: false, deletedAt: new Date() });
  }

  async restore(id: number): Promise<ZoneEntity> {
    return this.update(id, { isActive: true, deletedAt: null });
  }

  private toZoneEntity(row: {
    id: number;
    name: string;
    type: string;
    geometry: string;
  }): ZoneEntity {
    const isDeleted = row.name.startsWith('__deleted__:');
    return {
      id: row.id,
      name: isDeleted ? row.name.replace('__deleted__:', '') : row.name,
      type:
        row.type === 'PARKING' || row.type === 'RESTRICTED'
          ? row.type
          : 'ALLOWED',
      geometry: JSON.parse(row.geometry) as ZoneEntity['geometry'],
      isActive: !isDeleted,
      deletedAt: isDeleted ? new Date('1970-01-01T00:00:00.000Z') : null,
    };
  }
}
