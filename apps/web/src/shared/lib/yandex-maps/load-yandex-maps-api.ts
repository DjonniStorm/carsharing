import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

const SCRIPT_SELECTOR = 'script[data-yandex-maps-api="v3"]';

/** URL загрузки JS API 3.0 (ключ только в query, Referer ограничивается в кабинете ключа). */
export function buildYandexMapsScriptUrl(apiKey: string): string {
  const params = new URLSearchParams({
    apikey: apiKey,
    lang: "ru_RU",
  });
  return `https://api-maps.yandex.ru/v3/?${params.toString()}`;
}

let loading: Promise<void> | undefined;

/**
 * Динамически подключает скрипт JS API 3.0 и ждёт `ymaps3.ready`.
 * Повторные вызовы с тем же ключом переиспользуют загрузку.
 */
export function loadYandexMapsApi(apiKey: string): Promise<void> {
  if (!apiKey.trim()) {
    return Promise.reject(new Error(translate(LANG_KEYS.mapsLoader.emptyKey)));
  }

  if (typeof window === undefined) {
    return Promise.reject(
      new Error(translate(LANG_KEYS.mapsLoader.browserOnly)),
    );
  }

  const ready = window.ymaps3?.ready;
  if (ready) {
    return ready;
  }

  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const existing =
        document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR);
      if (existing) {
        if (window.ymaps3) {
          void finish(resolve, reject);
          return;
        }
        existing.addEventListener("load", () => void finish(resolve, reject));
        existing.addEventListener("error", () => {
          loading = undefined;
          reject(new Error(translate(LANG_KEYS.mapsLoader.scriptFailed)));
        });
        return;
      }

      const script = document.createElement("script");
      script.dataset.yandexMapsApi = "v3";
      script.async = true;
      script.src = buildYandexMapsScriptUrl(apiKey);
      script.onload = () => void finish(resolve, reject);
      script.onerror = () => {
        loading = undefined;
        reject(new Error(translate(LANG_KEYS.mapsLoader.scriptFailed)));
      };
      document.head.appendChild(script);
    });
  }

  return loading;
}

async function finish(resolve: () => void, reject: (e: Error) => void) {
  try {
    const api = window.ymaps3;
    if (!api) {
      loading = undefined;
      reject(new Error(translate(LANG_KEYS.mapsLoader.ymapsMissingAfterLoad)));
      return;
    }
    await api.ready;
    resolve();
  } catch (e) {
    loading = undefined;
    reject(e instanceof Error ? e : new Error(String(e)));
  }
}
