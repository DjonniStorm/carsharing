/** Минимальные типы для JS API 3.0 до выхода официального @types. */
export type YMapLngLat = [number, number];

export type YMapMarkerProps = {
  coordinates: YMapLngLat;
  draggable?: boolean;
};

/** Геометрия для {@link YMaps3Global.YMapFeature} (подмножество GeoJSON). */
export type YMapFeatureGeometry =
  | { type: "Polygon"; coordinates: YMapLngLat[][] }
  | { type: "LineString"; coordinates: YMapLngLat[] };

export type YMapFeatureStyle = {
  stroke?: Array<{ color: string; width: number }>;
  fill?: string;
};

export type YMapClickEvent = {
  coordinates?: YMapLngLat;
};

export type YMaps3MapInstance = {
  addChild: (child: unknown) => void;
  /** Снять дочерний объект (полигон, маркер и т.д.) — иначе артефакт может остаться на карте. */
  removeChild?: (child: unknown) => void;
  destroy: () => void;
};

export type YMaps3Global = {
  ready: Promise<void>;
  YMap: new (
    container: HTMLElement,
    props: {
      location: {
        center: YMapLngLat;
        zoom: number;
      };
    },
  ) => YMaps3MapInstance;
  YMapDefaultSchemeLayer: new (props?: Record<string, unknown>) => unknown;
  /** Слой для векторных объектов (полигоны, линии). */
  YMapDefaultFeaturesLayer?: new (props?: Record<string, unknown>) => unknown;
  /** Маркер с произвольным DOM в качестве содержимого. */
  YMapMarker?: new (props: YMapMarkerProps, element: HTMLElement) => unknown;
  YMapFeature?: new (props: {
    geometry: YMapFeatureGeometry;
    style?: YMapFeatureStyle;
  }) => unknown;
  YMapListener?: new (props: {
    onClick?: (object: unknown, event: YMapClickEvent) => void;
  }) => unknown;
};

declare global {
  interface Window {
    ymaps3?: YMaps3Global;
  }
}
