import { GeozoneType } from './geozone.type';

/**
 * Стабильная сущность геозоны (метаданные без геометрии).
 * Актуальная геометрия и правила — в {@link GeozoneVersionEntity} с id = currentVersionId.
 *
 * Обновление контура: закрыть предыдущую версию (`disabledAt`), создать новую,
 * выставить `currentVersionId`. Поездки ссылаются на версию на момент старта.
 */
export class GeozoneEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: GeozoneType,
    /** Цвет отрисовки на карте (например `#RRGGBB` или ключ темы). */
    public readonly color: string,
    /** id активной {@link GeozoneVersionEntity}. */
    public readonly currentVersionId: string,
    public readonly createdAt: Date,
    /** Софт-удаление зоны целиком; `null` — зона жива. */
    public readonly deletedAt: Date | null,
    public readonly createdByUserId: string,
  ) {}
}
