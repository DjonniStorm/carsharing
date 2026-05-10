import type { YMapLngLat } from "@/shared/lib/yandex-maps/ymaps3";

/** Центр по умолчанию (Ульяновск): долгота, широта — формат API 3.0. */
export const DEFAULT_MAP_CENTER: YMapLngLat = [48.3866, 54.3282];

export const DEFAULT_MAP_ZOOM = 11;

/** Fallback bbox до первого `onUpdate` карты; дальше запросы идут по видимой области (дебаунс на дашборде). */
export const DEFAULT_MAP_GEOZONE_BOUNDS = {
  minLon: 46.88,
  minLat: 51.935,
  maxLon: 50.12,
  maxLat: 55.065,
} as const;
