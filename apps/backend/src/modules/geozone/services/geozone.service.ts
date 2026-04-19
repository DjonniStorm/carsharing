import { Inject, Injectable } from '@nestjs/common';

import { GeozoneDbErrors } from '../common/db-errors';
import {
  GeozoneAlreadyDeletedException,
  GeozoneCreatedByUserIdRequiredException,
  GeozoneNotDeletedException,
  GeozoneNotFoundException,
  GeozoneVersionNotFoundException,
} from '../common/errors';
import { GeozoneMapper } from '../common/mapper';
import { GeozoneVersionCreate } from '../entities/dtos/geozone-version.create';
import { GeozoneVersionRead } from '../entities/dtos/geozone-version.read';
import { GeozoneCreate } from '../entities/dtos/geozone.create';
import { GeozoneRead } from '../entities/dtos/geozone.read';
import { GeozoneUpdate } from '../entities/dtos/geozone.update';
import type {
  GeozoneBoundingBoxParams,
  GeozoneContainingPointParams,
  GeozoneFindByIdOptions,
  GeozoneListParams,
  GeozoneVersionListFilters,
} from '../entities/geozone-query.types';
import type { IGeozoneRepository } from '../repositories/geozone.repository.interface';
import { IGeozoneRepositoryToken } from '../repositories/geozone.repository.interface';
import { IGeozoneService } from './geozone.service.interface';

@Injectable()
export class GeozoneService implements IGeozoneService {
  constructor(
    @Inject(IGeozoneRepositoryToken)
    private readonly geozoneRepository: IGeozoneRepository,
  ) {}

  /**
   * Создаёт зону и первую версию геометрии.
   * Без `createdByUserId` в DTO операция невозможна (обычно подставляется из JWT).
   */
  async create(geozone: GeozoneCreate): Promise<GeozoneRead> {
    const createdByUserId = geozone.createdByUserId;
    if (!createdByUserId?.trim()) {
      throw new GeozoneCreatedByUserIdRequiredException(
        'Поле createdByUserId обязательно',
      );
    }
    try {
      return await this.geozoneRepository.createWithInitialVersion(
        GeozoneMapper.toCreateRepositoryInput(geozone, createdByUserId),
      );
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Патч стабильных полей зоны. */
  async update(id: string, geozone: GeozoneUpdate): Promise<GeozoneRead> {
    try {
      return await this.geozoneRepository.updateZone(
        id,
        GeozoneMapper.toUpdatePatch(geozone),
      );
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Помечает зону удалённой. */
  async softDelete(id: string): Promise<GeozoneRead> {
    try {
      const zone = await this.geozoneRepository.findById(id);
      if (!zone) {
        throw new GeozoneNotFoundException(`Геозона не найдена: ${id}`);
      }
      if (zone.deletedAt != null) {
        throw new GeozoneAlreadyDeletedException(
          `Геозона уже удалена: ${id}`,
        );
      }
      return await this.geozoneRepository.setDeletedAt(id, new Date());
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Убирает отметку об удалении. */
  async restore(id: string): Promise<GeozoneRead> {
    try {
      const zone = await this.geozoneRepository.findById(id);
      if (!zone) {
        throw new GeozoneNotFoundException(`Геозона не найдена: ${id}`);
      }
      if (zone.deletedAt == null) {
        throw new GeozoneNotDeletedException(
          `Геозона не в состоянии удаления: ${id}`,
        );
      }
      return await this.geozoneRepository.setDeletedAt(id, null);
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Чтение зоны по id; при отсутствии записи — исключение. */
  async findById(
    id: string,
    options?: GeozoneFindByIdOptions,
  ): Promise<GeozoneRead> {
    try {
      const zone = await this.geozoneRepository.findById(id, options);
      if (!zone) {
        throw new GeozoneNotFoundException(`Геозона не найдена: ${id}`);
      }
      return zone;
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Список зон. */
  async findAll(params?: GeozoneListParams): Promise<GeozoneRead[]> {
    try {
      return await this.geozoneRepository.findMany(params);
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Публикует новую версию геометрии и правил. */
  async publishVersion(
    geozoneId: string,
    version: GeozoneVersionCreate,
  ): Promise<GeozoneRead> {
    try {
      return await this.geozoneRepository.publishNewVersion(
        geozoneId,
        version.geometry,
        version.rules ?? null,
      );
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Версии зоны; если зоны нет — исключение, а не пустой список. */
  async findVersions(
    geozoneId: string,
    filters?: GeozoneVersionListFilters,
  ): Promise<GeozoneVersionRead[]> {
    try {
      const zone = await this.geozoneRepository.findById(geozoneId);
      if (!zone) {
        throw new GeozoneNotFoundException(`Геозона не найдена: ${geozoneId}`);
      }
      return await this.geozoneRepository.findVersions(geozoneId, filters);
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Версия по id; при отсутствии — исключение. */
  async findVersionById(versionId: string): Promise<GeozoneVersionRead> {
    try {
      const version = await this.geozoneRepository.findVersionById(versionId);
      if (!version) {
        throw new GeozoneVersionNotFoundException(
          `Версия геозоны не найдена: ${versionId}`,
        );
      }
      return version;
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Зоны в видимой области карты (текущая геометрия). */
  async findInBoundingBox(
    params: GeozoneBoundingBoxParams,
  ): Promise<GeozoneRead[]> {
    try {
      const zoneIds = await this.geozoneRepository.findIdsInBoundingBox(params);
      return await this.geozoneRepository.findByIds(zoneIds, true);
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Зоны, содержащие точку (текущая геометрия). */
  async findContainingPoint(
    params: GeozoneContainingPointParams,
  ): Promise<GeozoneRead[]> {
    try {
      const zoneIds =
        await this.geozoneRepository.findIdsContainingPoint(params);
      return await this.geozoneRepository.findByIds(zoneIds, true);
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }
}
