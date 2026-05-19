import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import type { GeoJSONMultiPolygon } from '../geozone.geometry';

/**
 * Публикация новой версии: после сохранения — закрыть предыдущую (disabledAt),
 * обновить Geozone.currentVersionId на id этой версии.
 */
export class GeozoneVersionCreate {
  @IsNotEmpty()
  @IsObject()
  geometry: GeoJSONMultiPolygon;

  @IsOptional()
  @IsObject()
  rules?: Record<string, unknown> | null;

  /** Если задан — ставки берутся из шаблона (имеет приоритет над полями price*). */
  @IsOptional()
  @IsUUID()
  tariffPresetId?: string;

  /** Если не задан tariffPresetId, можно передать ставки явно или скопировать с текущей версии на сервере. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  pricePerMinute?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  pricePerKm?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  pausePricePerMinute?: number;
}
