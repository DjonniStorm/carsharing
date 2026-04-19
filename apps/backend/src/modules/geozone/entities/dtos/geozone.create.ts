import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
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

  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}
