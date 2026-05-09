import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class TelemetryDevicePoint {
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

  @IsOptional()
  source?: string;
}

export class TelemetryDevicePosition {
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

  @IsDateString()
  positionAt: string;
}
