/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Базовый URL NestJS API (без завершающего `/`). */
  readonly VITE_API_BASE_URL?: string;
  /** Ключ JS API 3.0 Яндекс.Карт (пакет «JavaScript API и HTTP Геокодер»). */
  readonly VITE_YANDEX_MAPS_API_KEY?: string;
  /**
   * Совпадает с `OPEN_MANAGER_SELF_REGISTER` на бэкенде: показывать выбор роли MANAGER/DRIVER
   * на форме регистрации и отправлять `role` в `POST /auth/register`.
   */
  readonly VITE_OPEN_MANAGER_SELF_REGISTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
