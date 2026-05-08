import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class TelemetryCreate {
  @IsDateString()
  timestamp: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  speed: number;

  @Type(() => Number)
  @IsNumber()
  acceleration: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  fuelLevel: number;

  @IsUUID()
  tripId: string;

  @IsOptional()
  source?: string;
}

