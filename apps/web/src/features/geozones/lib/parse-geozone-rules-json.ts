export type ParsedGeozoneRules =
  | { ok: true; value: Record<string, unknown> | null }
  | { ok: false };

/** Разбор textarea «правила версии»: пусто → null; иначе объект JSON. */
export function parseGeozoneRulesJson(raw: string): ParsedGeozoneRules {
  const trimmed = raw.trim();
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
