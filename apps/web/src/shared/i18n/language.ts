export type SupportedLanguage = 'ru' | 'en'

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['ru', 'en'] as const

function normalizeLang(raw: string | undefined): SupportedLanguage | undefined {
  if (!raw) {
    return undefined
  }
  const lower = raw.toLowerCase()
  if (lower.startsWith('en')) {
    return 'en'
  }
  if (lower.startsWith('ru')) {
    return 'ru'
  }
  return undefined
}

/**
 * Язык интерфейса: сначала `<html lang>`, иначе `navigator.language`, иначе `ru`.
 */
export function getInitialLanguage(): SupportedLanguage {
  if (typeof document !== 'undefined') {
    const fromHtml = normalizeLang(document.documentElement.lang)
    if (fromHtml) {
      return fromHtml
    }
  }
  if (typeof navigator !== 'undefined') {
    const fromNav = normalizeLang(navigator.language)
    if (fromNav) {
      return fromNav
    }
  }
  return 'ru'
}
