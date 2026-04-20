import type { GeoJSONMultiPolygon } from './geozone.geometry';

/** Произвольный JSON с правилами зоны (тарифы, ограничения и т.д.). */
export type GeozoneVersionRules = Record<string, unknown>;

/**
 * Версия геозоны: история геометрии и правил.
 * Активная версия: `disabledAt === null` и совпадает с `GeozoneEntity.currentVersionId`.
 */
export class GeozoneVersionEntity {
  constructor(
    public readonly id: string,
    public readonly geozoneId: string,
    public readonly geometry: GeoJSONMultiPolygon,
    public readonly rules: GeozoneVersionRules | null,
    public readonly pricePerMinute: number,
    public readonly pricePerKm: number,
    public readonly pausePricePerMinute: number,
    public readonly createdAt: Date,
    /** Версия снята с публикации; `null` — текущая активная для зоны (если она ещё current). */
    public readonly disabledAt: Date | null,
  ) {}
}
