import i18n from '@/shared/i18n/i18n'
import type { LangKey } from '@/shared/i18n/keys'

function resolveLng(explicit?: string): string {
  if (explicit) {
    return explicit
  }
  if (i18n.language) {
    return i18n.language
  }
  const fb = i18n.options.fallbackLng
  if (typeof fb === 'string') {
    return fb
  }
  if (Array.isArray(fb) && fb.length > 0 && typeof fb[0] === 'string') {
    return fb[0]
  }
  return 'ru'
}

type InterpolationVars = Record<string, string | number>

/**
 * Текст по ключу без React-хука (API, загрузчики, Zod при валидации).
 * Язык: явный `lng` или текущий `i18n.language`.
 * Интерполяция i18next: `translate(key, { status: 404 })` или `translate(key, 'en', { status: 404 })`.
 */
export function translate(key: LangKey, lng?: string): string
export function translate(key: LangKey, vars: InterpolationVars): string
export function translate(key: LangKey, lng: string, vars: InterpolationVars): string
export function translate(
  key: LangKey,
  lngOrVars?: string | InterpolationVars,
  maybeVars?: InterpolationVars,
): string {
  let lng: string | undefined
  let vars: InterpolationVars | undefined

  if (lngOrVars === undefined) {
    lng = undefined
    vars = undefined
  } else if (typeof lngOrVars === 'string') {
    lng = lngOrVars
    vars = maybeVars
  } else {
    lng = undefined
    vars = lngOrVars
  }

  const t = i18n.getFixedT(resolveLng(lng))
  return vars ? t(key, vars) : t(key)
}
