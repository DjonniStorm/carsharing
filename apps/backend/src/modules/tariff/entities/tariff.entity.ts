import { BaseEntity } from 'src/shared/types/entities/base-entity';

/**
 * Глобальный шаблон ставок (`tariff_preset`). Не участвует в расчёте поездки напрямую —
 * копируется в `GeoZoneVersion` при создании/публикации версии зоны.
 */
export class TariffPresetEntity extends BaseEntity<string> {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly pricePerMinute: number,
    public readonly pricePerKm: number,
    public readonly pausePricePerMinute: number,
    public readonly isDefault: boolean,
    public readonly isDeleted: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    super(id);
  }
}
