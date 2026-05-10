export { LANG_KEYS } from "@/shared/i18n/keys";
export type { LangKey } from "@/shared/i18n/keys";
export { default as i18n } from "@/shared/i18n/i18n";
export { en } from "@/shared/i18n/locales/en";
export { ru } from "@/shared/i18n/locales/ru";
export type { SupportedLanguage } from "@/shared/i18n/language";
export {
  getInitialLanguage,
  getStoredLanguage,
  getStoredLanguageOrFallback,
  LANGUAGE_STORAGE_KEY,
  persistLanguage,
  SUPPORTED_LANGUAGES,
} from "@/shared/i18n/language";
export { translate } from "@/shared/i18n/translate";
