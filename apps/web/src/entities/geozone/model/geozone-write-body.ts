import type { GeozoneType } from '@/entities/geozone/model/geozone-type'
import type { GeoJSONMultiPolygon } from '@/entities/geozone/model/geozone-geometry'

export type GeozoneCreateBody = {
  name: string
  type: GeozoneType
  color: string
  geometry: GeoJSONMultiPolygon
  rules?: Record<string, unknown> | null
  pricePerMinute: number
  pricePerKm: number
  pausePricePerMinute: number
  createdByUserId?: string
}

export type GeozoneUpdateBody = Partial<{
  name: string
  type: GeozoneType
  color: string
}>

export type GeozoneVersionCreateBody = {
  geometry: GeoJSONMultiPolygon
  rules?: Record<string, unknown> | null
  pricePerMinute: number
  pricePerKm: number
  pausePricePerMinute: number
}
