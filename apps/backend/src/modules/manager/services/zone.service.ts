import { Inject, Injectable } from '@nestjs/common';
import type { ZoneRepository } from '../repositories/zone.repository';
import { REPOSITORY_TOKENS } from '../../../shared/tokens/repository.tokens';
import {
  CreateZoneInput,
  GeoJSONPolygon,
  UpdateZoneInput,
} from '../../../shared/types/repository.types';

type GeoPoint = {
  lat: number;
  lon: number;
};

@Injectable()
export class ZoneService {
  constructor(
    @Inject(REPOSITORY_TOKENS.zone)
    private readonly zoneRepository: ZoneRepository,
  ) {}

  async createZone(data: CreateZoneInput) {
    this.assertZoneInput(data);
    return this.zoneRepository.create(data);
  }

  async updateZone(id: number, data: UpdateZoneInput) {
    this.assertPositiveId(id, 'zoneId');
    if (data.geometry) {
      this.assertGeoJsonPolygon(data.geometry);
    }
    return this.zoneRepository.update(id, data);
  }

  async softDeleteZone(id: number) {
    this.assertPositiveId(id, 'zoneId');
    return this.zoneRepository.softDelete(id);
  }

  async restoreZone(id: number) {
    this.assertPositiveId(id, 'zoneId');
    return this.zoneRepository.restore(id);
  }

  async getZones() {
    return this.zoneRepository.findAll();
  }

  async checkPointInZone(point: GeoPoint, zoneGeometry: GeoJSONPolygon): Promise<boolean> {
    if (!point || typeof point !== 'object') {
      throw new Error('Invalid point');
    }
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) {
      throw new Error('Invalid point');
    }
    this.assertGeoJsonPolygon(zoneGeometry);
    void point;
    void zoneGeometry;
    return false;
  }

  private assertZoneInput(data: CreateZoneInput): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Zone payload must be an object');
    }
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new Error('Invalid zone name');
    }
    if (!['ALLOWED', 'PARKING', 'RESTRICTED'].includes(data.type)) {
      throw new Error('Invalid zone type');
    }
    this.assertGeoJsonPolygon(data.geometry);
  }

  private assertGeoJsonPolygon(geometry: GeoJSONPolygon): void {
    if (!geometry || typeof geometry !== 'object') {
      throw new Error('Invalid geometry');
    }
    if (geometry.type !== 'Polygon') {
      throw new Error('Invalid geometry type');
    }
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      throw new Error('Invalid geometry coordinates');
    }
  }

  private assertPositiveId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Invalid ${field}`);
    }
  }
}
