import type { JsonWithPlaceholders } from './types.js';

export type PlaceholderVars = {
  to: string;
  body: string;
};

/**
 * Подставляет `{{to}}` и `{{body}}` в строках произвольного JSON-подобного дерева.
 */
export function substitutePlaceholders<T extends JsonWithPlaceholders>(
  value: T,
  vars: PlaceholderVars,
): T {
  if (typeof value === 'string') {
    return value
      .replaceAll('{{to}}', vars.to)
      .replaceAll('{{body}}', vars.body) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      substitutePlaceholders(item, vars),
    ) as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, JsonWithPlaceholders> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = substitutePlaceholders(child as JsonWithPlaceholders, vars);
    }
    return out as T;
  }
  return value;
}
