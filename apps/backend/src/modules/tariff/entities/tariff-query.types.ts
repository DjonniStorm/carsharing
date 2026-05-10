/**
 * Параметры списка шаблонов тарифов.
 */
export type TariffListParams = {
  /** `false` / не задано — только не удалённые (`is_deleted = false`). */
  includeDeleted?: boolean;
};
