import { Inject, Injectable } from '@nestjs/common';

import { TariffNotFoundException } from 'src/modules/tariff/common/errors';
import { ITariffRepositoryToken } from 'src/modules/tariff/repositories/tariff.repository.interface';
import type { ITariffRepository } from 'src/modules/tariff/repositories/tariff.repository.interface';

import { GeozoneDbErrors } from '../common/db-errors';
import {
  GeozoneAlreadyDeletedException,
  GeozoneCreatedByUserIdRequiredException,
  GeozoneInvalidPublishPricingException,
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
import type { GeozoneCreateRepositoryInput } from '../common/mapper';
import type { IGeozoneRepository } from '../repositories/geozone.repository.interface';
import { IGeozoneRepositoryToken } from '../repositories/geozone.repository.interface';
import { IGeozoneService } from './geozone.service.interface';

@Injectable()
export class GeozoneService implements IGeozoneService {
  constructor(
    @Inject(IGeozoneRepositoryToken)
    private readonly geozoneRepository: IGeozoneRepository,
    @Inject(ITariffRepositoryToken)
    private readonly tariffRepository: ITariffRepository,
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
      let input: GeozoneCreateRepositoryInput;
      if (geozone.tariffPresetId) {
        const preset = await this.tariffRepository.findActiveById(
          geozone.tariffPresetId,
        );
        if (!preset) {
          throw new TariffNotFoundException(
            `Шаблон тарифа не найден или удалён: ${geozone.tariffPresetId}`,
          );
        }
        input = {
          name: geozone.name,
          type: geozone.type,
          color: geozone.color,
          createdByUserId,
          geometry: geozone.geometry,
          rules: geozone.rules ?? null,
          pricePerMinute: preset.pricePerMinute,
          pricePerKm: preset.pricePerKm,
          pausePricePerMinute: preset.pausePricePerMinute,
          tariffPresetId: preset.id,
        };
      } else {
        input = GeozoneMapper.toCreateRepositoryInput(geozone, createdByUserId);
      }
      return await this.geozoneRepository.createWithInitialVersion(input);
    } catch (error) {
      GeozoneDbErrors.mapError(error);
    }
  }

  /** Патч стабильных полей зоны. */
  async update(
    id: string,
    geozone: Partial<GeozoneUpdate>,
  ): Promise<GeozoneRead> {
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
        throw new GeozoneAlreadyDeletedException(`Геозона уже удалена: ${id}`);
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
      let pricePerMinute: number;
      let pricePerKm: number;
      let pausePricePerMinute: number;
      let tariffPresetId: string | null;

      if (version.tariffPresetId) {
        const preset = await this.tariffRepository.findActiveById(
          version.tariffPresetId,
        );
        if (!preset) {
          throw new TariffNotFoundException(
            `Шаблон тарифа не найден или удалён: ${version.tariffPresetId}`,
          );
        }
        pricePerMinute = preset.pricePerMinute;
        pricePerKm = preset.pricePerKm;
        pausePricePerMinute = preset.pausePricePerMinute;
        tariffPresetId = preset.id;
      } else if (
        version.pricePerMinute !== undefined &&
        version.pricePerKm !== undefined &&
        version.pausePricePerMinute !== undefined
      ) {
        pricePerMinute = version.pricePerMinute;
        pricePerKm = version.pricePerKm;
        pausePricePerMinute = version.pausePricePerMinute;
        const zone = await this.geozoneRepository.findById(geozoneId);
        if (zone?.currentVersionId) {
          const snap = await this.geozoneRepository.findVersionPricingSnapshot(
            zone.currentVersionId,
          );
          tariffPresetId = snap?.tariffPresetId ?? null;
        } else {
          tariffPresetId = null;
        }
      } else {
        const zone = await this.geozoneRepository.findById(geozoneId);
        if (!zone?.currentVersionId) {
          throw new GeozoneInvalidPublishPricingException(
            'Укажите tariffPresetId, все три ставки в теле, либо опирайтесь на текущую версию (должна существовать)',
          );
        }
        const snap = await this.geozoneRepository.findVersionPricingSnapshot(
          zone.currentVersionId,
        );
        if (!snap) {
          throw new GeozoneInvalidPublishPricingException(
            'Не удалось прочитать ставки текущей версии',
          );
        }
        pricePerMinute = snap.pricePerMinute;
        pricePerKm = snap.pricePerKm;
        pausePricePerMinute = snap.pausePricePerMinute;
        tariffPresetId = snap.tariffPresetId;
      }

      return await this.geozoneRepository.publishNewVersion(geozoneId, {
        geometry: version.geometry,
        rules: version.rules ?? null,
        pricePerMinute,
        pricePerKm,
        pausePricePerMinute,
        tariffPresetId,
      });
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
