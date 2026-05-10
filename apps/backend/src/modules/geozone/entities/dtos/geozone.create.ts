import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

import type { GeoJSONMultiPolygon } from '../geozone.geometry';
import { GeozoneType } from '../geozone.type';

/**
 * Создание зоны: стабильные поля + начальная геометрия (первая версия).
 * `createdByUserId` обычно проставляется из контекста авторизации, не из тела.
 */
export class GeozoneCreate {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsNotEmpty()
  @IsEnum(GeozoneType)
  type: GeozoneType;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  color: string;

  @IsNotEmpty()
  @IsObject()
  geometry: GeoJSONMultiPolygon;

  @IsOptional()
  @IsObject()
  rules?: Record<string, unknown> | null;

  /** Если задан — ставки копируются из шаблона; поля `price*` ниже не обязательны. */
  @IsOptional()
  @IsUUID()
  tariffPresetId?: string;

  @ValidateIf((o: GeozoneCreate) => !o.tariffPresetId)
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  pricePerMinute?: number;

  @ValidateIf((o: GeozoneCreate) => !o.tariffPresetId)
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  pricePerKm?: number;

  @ValidateIf((o: GeozoneCreate) => !o.tariffPresetId)
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  pausePricePerMinute?: number;

  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}
