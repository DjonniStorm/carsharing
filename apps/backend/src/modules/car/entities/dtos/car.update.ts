import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { FIELD_LIMITS } from '@carsharing/validation';

import { CarStatus } from '../car-status';

/** PATCH /cars/:id — только изменяемые поля. */
export class CarUpdateDto {
  @IsOptional()
  @IsString()
  @MinLength(FIELD_LIMITS.CAR_STRING_MIN)
  @MaxLength(FIELD_LIMITS.CAR_STRING_MAX)
  brand?: string;

  @IsOptional()
  @IsString()
  @MinLength(FIELD_LIMITS.CAR_STRING_MIN)
  @MaxLength(FIELD_LIMITS.CAR_STRING_MAX)
  model?: string;

  @IsOptional()
  @IsString()
  @MinLength(FIELD_LIMITS.CAR_STRING_MIN)
  @MaxLength(FIELD_LIMITS.CAR_STRING_MAX)
  licensePlate?: string;

  @IsOptional()
  @IsString()
  @MinLength(FIELD_LIMITS.CAR_STRING_MIN)
  @MaxLength(FIELD_LIMITS.CAR_STRING_MAX)
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsNumber()
  @Min(FIELD_LIMITS.CAR_FUEL_MIN)
  @Max(FIELD_LIMITS.CAR_FUEL_MAX)
  fuelLevel?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsEnum(CarStatus)
  carStatus?: CarStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lastKnownLat?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lastKnownLon?: number | null;
}
