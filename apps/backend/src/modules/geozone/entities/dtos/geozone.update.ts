import { FIELD_LIMITS } from '@carsharing/validation';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { GeozoneType } from '../geozone.type';

/** Патч стабильных полей зоны (без геометрии; геометрия — отдельный сценарий новой версии). */
export class GeozoneUpdate {
  @IsOptional()
  @IsString()
  @MinLength(FIELD_LIMITS.GEOZONE_NAME_MIN)
  @MaxLength(FIELD_LIMITS.GEOZONE_NAME_MAX)
  name?: string;

  @IsOptional()
  @IsEnum(GeozoneType)
  type?: GeozoneType;

  @IsOptional()
  @IsString()
  @MinLength(FIELD_LIMITS.GEOZONE_COLOR_MIN)
  @MaxLength(FIELD_LIMITS.GEOZONE_COLOR_MAX)
  color?: string;
}
