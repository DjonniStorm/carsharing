/** Минимальные типы для JS API 3.0 до выхода официального @types. */
export type YMapLngLat = [number, number];

export type YMapMarkerProps = {
  coordinates: YMapLngLat;
  draggable?: boolean;
};

export type YMaps3MapInstance = {
  addChild: (child: unknown) => void;
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
  YMapDefaultSchemeLayer: new () => unknown;
  /** Слой для объектов (маркеры и т.д.). */
  YMapDefaultFeaturesLayer?: new () => unknown;
  /** Маркер с произвольным DOM в качестве содержимого. */
  YMapMarker?: new (props: YMapMarkerProps, element: HTMLElement) => unknown;
};

declare global {
  interface Window {
    ymaps3?: YMaps3Global;
  }
}
