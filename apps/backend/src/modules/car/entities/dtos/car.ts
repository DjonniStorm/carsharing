import { FIELD_LIMITS } from '@carsharing/validation';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { CarStatus } from '../car-status';

// Create and update car dto
export class Car {
  @IsNotEmpty()
  @IsString()
  @MinLength(FIELD_LIMITS.CAR_STRING_MIN)
  @MaxLength(FIELD_LIMITS.CAR_STRING_MAX)
  brand: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(FIELD_LIMITS.CAR_STRING_MIN)
  @MaxLength(FIELD_LIMITS.CAR_STRING_MAX)
  model: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(FIELD_LIMITS.CAR_STRING_MIN)
  @MaxLength(FIELD_LIMITS.CAR_STRING_MAX)
  licensePlate: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(FIELD_LIMITS.CAR_STRING_MIN)
  @MaxLength(FIELD_LIMITS.CAR_STRING_MAX)
  color: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  mileage: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  fuelLevel: number;

  @IsNotEmpty()
  @IsBoolean()
  isAvailable: boolean;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedAt?: Date | null;

  @IsNotEmpty()
  @IsEnum(CarStatus)
  carStatus: CarStatus;

  @IsNotEmpty()
  @IsBoolean()
  isDeleted: boolean;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lastKnownLat?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lastKnownLon?: number | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastPositionAt?: Date | null;
}
