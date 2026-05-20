import type { GeozoneRead } from "@/entities/geozone";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";
import { loadYandexMapsApi } from "@/shared/lib/yandex-maps/load-yandex-maps-api";

import type {
  YMapFeatureStyle,
  YMapLngLat,
  YMapMarkerInstance,
  YMaps3Global,
  YMaps3MapInstance,
} from "@/shared/lib/yandex-maps/ymaps3";

export type YandexMapOverlayMarker = {
  id?: string;
  coordinates: YMapLngLat;
  label: string;
  tone?: "available" | "inUse" | "offline" | "tripStart" | "tripFinish";
};

export type YandexSchemeMapOptions = {
  center: YMapLngLat;
  zoom: number;
};

export type YandexMapMountHandle = {
  destroy: () => void;
  map: YMaps3MapInstance;
};

const toneColor: Record<NonNullable<YandexMapOverlayMarker["tone"]>, string> = {
  available: "#22c55e",
  inUse: "#228be6",
  offline: "#adb5bd",
  tripStart: "#16a34a",
  tripFinish: "#c2255c",
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

function detachMapChild(map: YMaps3MapInstance, entity: unknown): void {
  const removeChild = map.removeChild;
  if (typeof removeChild === "function") {
    try {
      removeChild.call(map, entity);
      return;
    } catch {
      // уже снят или иная модель жизненного цикла
    }
  }
  destroyUnknown(entity);
}

function hexToGeozonePolygonStyle(hex: string): YMapFeatureStyle {
  const raw = hex.trim().replace(/^#/, "");
  const safe =
    raw.length === 6 && /^[0-9a-fA-F]+$/.test(raw) ? `#${raw}` : "#868e96";
  return {
    stroke: [{ color: `${safe}DD`, width: 2 }],
    fill: `${safe}33`,
  };
}

export type GeozonePolygonsController = {
  setGeozones: (geozones: GeozoneRead[] | null | undefined) => void;
  destroy: () => void;
};

export function createGeozonePolygonsController(
  map: YMaps3MapInstance,
): GeozonePolygonsController {
  const ymaps3 = window.ymaps3;
  if (!ymaps3) {
    return {
      setGeozones: () => {},
      destroy: () => {},
    };
  }
  const YMapFeatureCtor = ymaps3.YMapFeature;
  if (!YMapFeatureCtor) {
    return {
      setGeozones: () => {},
      destroy: () => {},
    };
  }

  const entities: unknown[] = [];

  function clear() {
    for (const e of entities) {
      detachMapChild(map, e);
    }
    entities.length = 0;
  }

  function setGeozones(geozones: GeozoneRead[] | null | undefined) {
    clear();
    if (!geozones?.length) {
      return;
    }

    for (const gz of geozones) {
      const geom = gz.currentVersion?.geometry;
      if (!geom || geom.type !== "MultiPolygon") {
        continue;
      }
      const style = hexToGeozonePolygonStyle(gz.color || "#868e96");
      for (const polygon of geom.coordinates) {
        if (!polygon?.length) {
          continue;
        }
        const coordinates = polygon as YMapLngLat[][];
        const feature = new (YMapFeatureCtor as NonNullable<
          YMaps3Global["YMapFeature"]
        >)({
          geometry: { type: "Polygon", coordinates },
          style,
        });
        map.addChild(feature);
        entities.push(feature);
      }
    }
  }

  function destroy() {
    clear();
  }

  return { setGeozones, destroy };
}

export type TripRoutePolylineController = {
  setRoute: (coordinates: YMapLngLat[] | null | undefined) => void;
  destroy: () => void;
};

export function createTripRoutePolylineController(
  map: YMaps3MapInstance,
): TripRoutePolylineController {
  const ymaps3 = window.ymaps3;
  const YMapFeatureCtor = ymaps3?.YMapFeature;
  if (!ymaps3 || !YMapFeatureCtor) {
    return {
      setRoute: () => {},
      destroy: () => {},
    };
  }

  let lineFeature: unknown | null = null;

  function clearLine() {
    if (lineFeature) {
      detachMapChild(map, lineFeature);
      lineFeature = null;
    }
  }

  function setRoute(coordinates: YMapLngLat[] | null | undefined) {
    clearLine();
    if (!coordinates || coordinates.length < 2) {
      return;
    }
    const feature = new (YMapFeatureCtor as NonNullable<
      YMaps3Global["YMapFeature"]
    >)({
      geometry: { type: "LineString", coordinates },
      style: {
        stroke: [{ color: "#c2255c", width: 4 }],
      },
    });
    map.addChild(feature);
    lineFeature = feature;
  }

  function destroy() {
    clearLine();
  }

  return { setRoute, destroy };
}

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
      detachMapChild(map, entity);
    }
    detachMapChild(map, featuresLayer);
  };
}

export type OverlayMarkersController = {
  setMarkers: (markers: YandexMapOverlayMarker[] | undefined) => void;
  destroy: () => void;
};

export type OverlayMarkersControllerOptions = {
  resolveMarkerClick?: () => ((carId: string) => void) | undefined;
};

type ManagedMarker = {
  marker: YMapMarkerInstance;
  spec: YandexMapOverlayMarker;
  rootEl: HTMLElement;
  markerClickHandler?: (e: MouseEvent) => void;
};

// Маркеры с id обновляют координаты без пересоздания DOM.
export function createOverlayMarkersController(
  map: YMaps3MapInstance,
  options?: OverlayMarkersControllerOptions,
): OverlayMarkersController {
  const ymaps3 = window.ymaps3;
  if (!ymaps3?.YMapMarker) {
    return {
      setMarkers: () => {},
      destroy: () => {},
    };
  }
  const MarkerCtor = ymaps3.YMapMarker;

  const byId = new Map<string, ManagedMarker>();
  let anonymous: ManagedMarker[] = [];

  function detachManagedMarker(entry: ManagedMarker): void {
    if (entry.markerClickHandler) {
      entry.rootEl.removeEventListener("click", entry.markerClickHandler);
      entry.markerClickHandler = undefined;
    }
    detachMapChild(map, entry.marker);
  }

  function createMarker(m: YandexMapOverlayMarker): ManagedMarker {
    const el = buildOverlayMarkerElement(m);
    let markerClickHandler: ((e: MouseEvent) => void) | undefined;
    if (m.id && options?.resolveMarkerClick) {
      markerClickHandler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        options.resolveMarkerClick?.()?.(m.id!);
      };
      el.addEventListener("click", markerClickHandler);
    }
    const instance = new MarkerCtor({ coordinates: m.coordinates }, el);
    map.addChild(instance);
    return {
      marker: instance,
      spec: m,
      rootEl: el,
      markerClickHandler,
    };
  }

  function disposeAnonymous() {
    for (const a of anonymous) {
      detachManagedMarker(a);
    }
    anonymous = [];
  }

  function setMarkers(markers: YandexMapOverlayMarker[] | undefined): void {
    disposeAnonymous();

    const seen = new Set<string>();
    if (markers) {
      for (const m of markers) {
        if (!m.id) {
          anonymous.push(createMarker(m));
          continue;
        }

        seen.add(m.id);
        const existing = byId.get(m.id);
        if (!existing) {
          byId.set(m.id, createMarker(m));
          continue;
        }

        const sameLook =
          existing.spec.label === m.label && existing.spec.tone === m.tone;
        if (!sameLook) {
          detachManagedMarker(existing);
          byId.set(m.id, createMarker(m));
          continue;
        }

        const sameCoords =
          existing.spec.coordinates[0] === m.coordinates[0] &&
          existing.spec.coordinates[1] === m.coordinates[1];
        if (!sameCoords) {
          existing.marker.update({ coordinates: m.coordinates });
        }
        existing.spec = m;
      }
    }

    for (const [id, entry] of byId) {
      if (!seen.has(id)) {
        detachManagedMarker(entry);
        byId.delete(id);
      }
    }
  }

  function destroy(): void {
    disposeAnonymous();
    for (const entry of byId.values()) {
      detachManagedMarker(entry);
    }
    byId.clear();
  }

  return { setMarkers, destroy };
}

export class YandexMapsRenderService {
  private static instance: YandexMapsRenderService | undefined;

  static getInstance(): YandexMapsRenderService {
    if (!YandexMapsRenderService.instance) {
      YandexMapsRenderService.instance = new YandexMapsRenderService();
    }
    return YandexMapsRenderService.instance;
  }

  private constructor() {}

  ensureApiLoaded(apiKey: string): Promise<void> {
    return loadYandexMapsApi(apiKey);
  }

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

  async mountSchemeMapOnlyAsync(
    apiKey: string,
    container: HTMLElement,
    options: YandexSchemeMapOptions,
  ): Promise<YandexMapMountHandle> {
    await this.ensureApiLoaded(apiKey);
    return this.mountSchemeMapOnly(container, options);
  }
}

export const yandexMapsRenderService = YandexMapsRenderService.getInstance();
