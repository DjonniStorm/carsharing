export type SupportedLanguage = "ru" | "en";

export const LANGUAGE_STORAGE_KEY = "app_ui_language";

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  "ru",
  "en",
] as const;

function normalizeLang(raw: string | undefined): SupportedLanguage | undefined {
  if (!raw) {
    return undefined;
  }
  const lower = raw.toLowerCase();
  if (lower.startsWith("en")) {
    return "en";
  }
  if (lower.startsWith("ru")) {
    return "ru";
  }
  return undefined;
}

/**
 * Язык интерфейса: сначала `<html lang>`, иначе `navigator.language`, иначе `ru`.
 */
export function getInitialLanguage(): SupportedLanguage {
  if (typeof document !== "undefined") {
    const fromHtml = normalizeLang(document.documentElement.lang);
    if (fromHtml) {
      return fromHtml;
    }
  }
  if (typeof navigator !== "undefined") {
    const fromNav = normalizeLang(navigator.language);
    if (fromNav) {
      return fromNav;
    }
  }
  return "ru";
}

/** Язык из localStorage, если пользователь уже переключал интерфейс. */
export function getStoredLanguage(): SupportedLanguage | undefined {
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (raw === "ru" || raw === "en") {
    return raw;
  }
  return undefined;
}

export function getStoredLanguageOrFallback(): SupportedLanguage {
  return getStoredLanguage() ?? getInitialLanguage();
}

export function persistLanguage(lang: SupportedLanguage): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}
