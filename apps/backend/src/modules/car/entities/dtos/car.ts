import {
  IsBoolean,
  IsDateString,
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
  @MinLength(1)
  @MaxLength(255)
  brand: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  model: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  licensePlate: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
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
  @IsDateString()
  lastPositionAt?: string | null;
}
