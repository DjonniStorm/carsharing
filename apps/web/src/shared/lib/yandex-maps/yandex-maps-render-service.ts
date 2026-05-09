import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";
import { loadYandexMapsApi } from "@/shared/lib/yandex-maps/load-yandex-maps-api";

import type {
  YMapLngLat,
  YMaps3MapInstance,
} from "@/shared/lib/yandex-maps/ymaps3";

export type YandexMapOverlayMarker = {
  coordinates: YMapLngLat;
  label: string;
  /** Цвет индикатора на маркере (как в легенде карты). */
  tone?: "available" | "inUse" | "offline";
};

export type YandexSchemeMapOptions = {
  center: YMapLngLat;
  zoom: number;
};

export type YandexMapMountHandle = {
  destroy: () => void;
  /** Экземпляр карты для навешивания маркеров без полного перемонтирования. */
  map: YMaps3MapInstance;
};

/** @deprecated используйте {@link mountSchemeMapOnly} + {@link attachOverlayMarkers} */
export type YandexBasicMapOptions = YandexSchemeMapOptions & {
  overlayMarkers?: YandexMapOverlayMarker[];
};

const toneColor: Record<NonNullable<YandexMapOverlayMarker["tone"]>, string> = {
  available: "#22c55e",
  inUse: "#228be6",
  offline: "#adb5bd",
};

function buildOverlayMarkerElement(
  marker: YandexMapOverlayMarker,
): HTMLElement {
  const tone = marker.tone ?? "inUse";
  const dotColor = toneColor[tone];

  const root = document.createElement("div");
  root.style.cssText = [
    "display:flex",
    "align-items:center",
    "gap:8px",
    "padding:6px 12px",
    "border-radius:999px",
    "background:#ffffff",
    "box-shadow:0 2px 12px rgba(15,23,42,0.18)",
    "font-family:system-ui,-apple-system,sans-serif",
    "font-size:12px",
    "font-weight:600",
    "color:#1a1b1e",
    "white-space:nowrap",
    "pointer-events:auto",
    "user-select:none",
  ].join(";");

  const dot = document.createElement("span");
  dot.style.cssText = `flex-shrink:0;width:8px;height:8px;border-radius:50%;background:${dotColor}`;

  const text = document.createElement("span");
  text.textContent = marker.label;

  root.append(dot, text);
  return root;
}

function destroyUnknown(entity: unknown): void {
  if (
    entity &&
    typeof entity === "object" &&
    "destroy" in entity &&
    typeof (entity as { destroy: unknown }).destroy === "function"
  ) {
    (entity as { destroy: () => void }).destroy();
  }
}

/** Слой объектов для полигонов/линий (JS API 3.0). Без него {@link YMapFeature} может не отображаться. */
export function attachDefaultFeaturesLayer(map: YMaps3MapInstance): () => void {
  const ymaps3 = window.ymaps3;
  const Features = ymaps3?.YMapDefaultFeaturesLayer;
  if (!Features) {
    return () => {};
  }
  const layer = new Features({});
  map.addChild(layer);
  return () => {
    destroyUnknown(layer);
  };
}

/**
 * Добавляет слой объектов и маркеры. Возвращает функцию отключения (без уничтожения карты).
 */
export function attachOverlayMarkers(
  map: YMaps3MapInstance,
  markers: YandexMapOverlayMarker[] | undefined,
): () => void {
  const ymaps3 = window.ymaps3;
  if (!markers?.length || !ymaps3) {
    return () => {};
  }

  const Features = ymaps3.YMapDefaultFeaturesLayer;
  const Marker = ymaps3.YMapMarker;
  if (!Features || !Marker) {
    return () => {};
  }

  const featuresLayer = new Features();
  map.addChild(featuresLayer);

  const markerEntities: unknown[] = [];
  for (const m of markers) {
    const el = buildOverlayMarkerElement(m);
    const markerEntity = new Marker({ coordinates: m.coordinates }, el);
    map.addChild(markerEntity);
    markerEntities.push(markerEntity);
  }

  return () => {
    for (const entity of markerEntities) {
      destroyUnknown(entity);
    }
    destroyUnknown(featuresLayer);
  };
}

/**
 * Один экземпляр на приложение: координирует создание карт поверх уже дедуплицированной
 * загрузки скрипта (`loadYandexMapsApi`).
 */
export class YandexMapsRenderService {
  private static instance: YandexMapsRenderService | undefined;

  static getInstance(): YandexMapsRenderService {
    if (!YandexMapsRenderService.instance) {
      YandexMapsRenderService.instance = new YandexMapsRenderService();
    }
    return YandexMapsRenderService.instance;
  }

  private constructor() {}

  /** Скрипт JS API 3.0 + `ymaps3.ready` (идемпотентно для одного ключа на вкладку). */
  ensureApiLoaded(apiKey: string): Promise<void> {
    return loadYandexMapsApi(apiKey);
  }

  /** Карта со схемой без маркеров — маркеры вешайте через {@link attachOverlayMarkers}. */
  mountSchemeMapOnly(
    container: HTMLElement,
    options: YandexSchemeMapOptions,
  ): YandexMapMountHandle {
    const ymaps3 = window.ymaps3;
    if (!ymaps3) {
      throw new Error(translate(LANG_KEYS.runtime.ymapsUnavailable));
    }

    const { YMap, YMapDefaultSchemeLayer } = ymaps3;
    const map = new YMap(container, {
      location: {
        center: options.center,
        zoom: options.zoom,
      },
    });
    map.addChild(new YMapDefaultSchemeLayer());

    return {
      map,
      destroy: () => {
        map.destroy();
      },
    };
  }

  /** Загрузка API и монтаж только схемы. */
  async mountSchemeMapOnlyAsync(
    apiKey: string,
    container: HTMLElement,
    options: YandexSchemeMapOptions,
  ): Promise<YandexMapMountHandle> {
    await this.ensureApiLoaded(apiKey);
    return this.mountSchemeMapOnly(container, options);
  }

  /**
   * Карта со схемой по умолчанию и опциональными маркерами (одним монтированием).
   * Предпочтительнее для React разделять схему и маркеры, чтобы не пересоздавать карту.
   */
  mountBasicSchemeMap(
    container: HTMLElement,
    options: YandexBasicMapOptions,
  ): YandexMapMountHandle {
    const { overlayMarkers, ...scheme } = options;
    const handle = this.mountSchemeMapOnly(container, scheme);
    let detachMarkers = attachOverlayMarkers(handle.map, overlayMarkers);
    const destroy = handle.destroy;
    return {
      map: handle.map,
      destroy: () => {
        detachMarkers();
        detachMarkers = () => {};
        destroy();
      },
    };
  }

  /** Загрузка API и монтаж карты одним вызовом (типовой сценарий для React-effect). */
  async mountBasicSchemeMapAsync(
    apiKey: string,
    container: HTMLElement,
    options: YandexBasicMapOptions,
  ): Promise<YandexMapMountHandle> {
    await this.ensureApiLoaded(apiKey);
    return this.mountBasicSchemeMap(container, options);
  }
}

export const yandexMapsRenderService = YandexMapsRenderService.getInstance();
