/**
 * GeoJSON (RFC 7946) фрагменты для геозоны.
 * `MultiPolygon` в PostGIS удобно стыкуется через ST_GeomFromGeoJSON / ST_AsGeoJSON
 * и с библиотеками карт (единый формат для отрисовки и расчётов).
 *
 * Один простой полигон задаётся как MultiPolygon с одним элементом в `coordinates`.
 */

export type GeoJSONPosition = [number, number];

/** Кольцо: замкнутая линия [lon, lat] (последняя точка = первой для внешнего контура). */
export type GeoJSONLinearRing = GeoJSONPosition[];

export type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: GeoJSONLinearRing[];
};

export type GeoJSONMultiPolygon = {
  type: 'MultiPolygon';
  /**
   * RFC 7946: массив полигонов; у каждого полигона первое кольцо — внешний контур,
   * остальные — дыры. Не путать с массивом объектов `GeoJSONPolygon`.
   */
  coordinates: GeoJSONLinearRing[][][];
};
