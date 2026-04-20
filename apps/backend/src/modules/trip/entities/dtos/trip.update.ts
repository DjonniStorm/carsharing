import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { TripStatus } from '../trip.status';

/**
 * Патч поездки (смена статуса, пауза, финиш, биллинг, снимки машины).
 */
export class TripUpdate {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  finishedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  pauseStartedAt?: Date | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPausedSec?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  startLat?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  startLng?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  finishLat?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  finishLng?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceMeters?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  chargedMinutes?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  chargedKm?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  priceTime?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  priceDistance?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  pricePause?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  priceTotal?: number | null;

  @IsOptional()
  @IsUUID()
  tariffVersionId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  carPlateSnapshot?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  carDisplayNameSnapshot?: string | null;
}
