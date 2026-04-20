import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

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

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  pricePerMinute: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  pricePerKm: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  pausePricePerMinute: number;
}
