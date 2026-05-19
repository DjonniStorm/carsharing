import { FIELD_LIMITS } from '@carsharing/validation';
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

import { MaxJsonSerializedLength } from 'src/shared/validation/max-json-serialized-length.validator';

import type { GeoJSONMultiPolygon } from '../geozone.geometry';
import { GeozoneType } from '../geozone.type';

/**
 * Создание зоны: стабильные поля + начальная геометрия (первая версия).
 * createdByUserId обычно проставляется из контекста авторизации, не из тела.
 */
export class GeozoneCreate {
  @IsNotEmpty()
  @IsString()
  @MinLength(FIELD_LIMITS.GEOZONE_NAME_MIN)
  @MaxLength(FIELD_LIMITS.GEOZONE_NAME_MAX)
  name: string;

  @IsNotEmpty()
  @IsEnum(GeozoneType)
  type: GeozoneType;

  @IsNotEmpty()
  @IsString()
  @MinLength(FIELD_LIMITS.GEOZONE_COLOR_MIN)
  @MaxLength(FIELD_LIMITS.GEOZONE_COLOR_MAX)
  color: string;

  @IsNotEmpty()
  @IsObject()
  geometry: GeoJSONMultiPolygon;

  @IsOptional()
  @IsObject()
  @MaxJsonSerializedLength(FIELD_LIMITS.GEOZONE_RULES_JSON_MAX)
  rules?: Record<string, unknown> | null;

  /** Если задан — ставки копируются из шаблона; поля price* ниже не обязательны. */
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
