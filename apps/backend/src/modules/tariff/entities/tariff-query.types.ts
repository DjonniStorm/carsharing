/**
 * Параметры чтения тарифа из хранилища.
 *
 * Где описывать «тариф + геозона»:
 * - **Опции загрузки** (`TariffFindByIdOptions`) — здесь, рядом с репозиторием/сервисом.
 * - **Форма ответа API** — в `dtos/tariff.read.ts` (поле `geoZone?: GeozoneRead`): так Swagger и клиенты
 *   видят вложенный объект; `GeozoneRead` остаётся единым типом зоны из модуля geozone.
 */
export type TariffFindByIdOptions = {
  /**
   * `true` — один запрос с `include: { geoZone: true }` в репозитории, без второго round-trip.
   */
  withGeoZone?: boolean;
};

export type TariffListParams = {
  geoZoneId?: string;
  /** `false` / не задано — только не удалённые (`deleted_at IS NULL`). */
  includeDeleted?: boolean;
};
