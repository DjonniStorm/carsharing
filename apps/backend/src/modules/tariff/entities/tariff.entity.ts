import { BaseEntity } from 'src/shared/types/entities/base-entity';

/**
 * Тариф привязан к геозоне: цена за минуту и за километр.
 * `id` — UUID (первичный ключ в БД).
 */
export class TariffEntity extends BaseEntity<string> {
  constructor(
    public readonly id: string,
    public readonly name: string,
    /** Руб/мин — в БД NUMERIC(19,2). */
    public readonly pricePerMinute: number,
    /** Руб/км — в БД NUMERIC(19,2). */
    public readonly pricePerKm: number,
    public readonly geoZoneId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    /** Софт-удаление; `null` — тариф активен. */
    public readonly deletedAt: Date | null,
  ) {
    super(id);
  }
}
