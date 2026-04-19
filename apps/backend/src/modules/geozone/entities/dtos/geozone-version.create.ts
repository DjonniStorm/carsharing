import { IsNotEmpty, IsObject, IsOptional } from 'class-validator';

import type { GeoJSONMultiPolygon } from '../geozone.geometry';

/**
 * Публикация новой версии: после сохранения — закрыть предыдущую (`disabledAt`),
 * обновить `Geozone.currentVersionId` на id этой версии.
 */
export class GeozoneVersionCreate {
  @IsNotEmpty()
  @IsObject()
  geometry: GeoJSONMultiPolygon;

  @IsOptional()
  @IsObject()
  rules?: Record<string, unknown> | null;
}
