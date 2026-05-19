import { FIELD_LIMITS } from "@carsharing/validation";

import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

export type ParsedGeozoneRules =
  | { ok: true; value: Record<string, unknown> | null }
  | { ok: false; message?: string };

/** Разбор textarea «правила версии»: пусто → null; иначе объект JSON. */
export function parseGeozoneRulesJson(raw: string): ParsedGeozoneRules {
  const trimmed = raw.trim();
  if (trimmed.length > FIELD_LIMITS.GEOZONE_RULES_JSON_MAX) {
    return {
      ok: false,
      message: translate(LANG_KEYS.validation.geozoneRulesJsonMax),
    };
  }
  if (!trimmed) {
    return { ok: true, value: null };
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return { ok: true, value: parsed as Record<string, unknown> };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
