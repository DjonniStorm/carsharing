import type { YMapLngLat } from '@/shared/lib/yandex-maps/ymaps3'

/** Центр по умолчанию (Москва): долгота, широта — формат API 3.0. */
export const DEFAULT_MAP_CENTER: YMapLngLat = [37.588_144, 55.733_842]

export const DEFAULT_MAP_ZOOM = 11

/** Начальный bbox для подгрузки геозон на дашборде (вокруг {@link DEFAULT_MAP_CENTER}). */
export const DEFAULT_MAP_GEOZONE_BOUNDS = {
  minLon: 37.47,
  minLat: 55.67,
  maxLon: 37.71,
  maxLat: 55.8,
} as const

