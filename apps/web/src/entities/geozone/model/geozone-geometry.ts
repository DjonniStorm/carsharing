/** RFC 7946 MultiPolygon — координаты [lon, lat]. */
export type GeoJSONMultiPolygon = {
  type: 'MultiPolygon'
  coordinates: number[][][][]
}

export type GeozoneVersionRules = Record<string, unknown>
