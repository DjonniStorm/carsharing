/**
 * Совпадает с `ViolationStatus` на бэкенде (число в БД `violation.type`).
 * Удобно вызвать `violationTitleFromKind(entity.type)` при сборке письма.
 */
export function violationTitleFromKind(type: number): string {
  const labels: Record<number, string> = {
    1: 'Превышение скорости',
    2: 'Выезд за границы геозоны',
    3: 'Парковка вне разрешённой зоны',
    4: 'Низкий уровень топлива',
    5: 'Решено',
    6: 'Игнорировано',
    7: 'Неизвестный тип',
  };
  return labels[type] ?? 'Нарушение';
}
