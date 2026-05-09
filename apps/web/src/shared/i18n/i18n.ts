import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { en } from '@/shared/i18n/locales/en'
import { ru } from '@/shared/i18n/locales/ru'
import { getInitialLanguage } from '@/shared/i18n/language'

void i18n.use(initReactI18next).init({
  lng: getInitialLanguage(),
  fallbackLng: 'ru',
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
