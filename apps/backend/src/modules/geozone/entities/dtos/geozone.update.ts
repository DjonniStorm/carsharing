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
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(GeozoneType)
  type?: GeozoneType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  color?: string;
}
