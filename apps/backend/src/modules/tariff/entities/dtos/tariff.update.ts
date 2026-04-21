import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Патч полей тарифа (без смены id).
 */
export class TariffUpdate {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerMinute?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerKm?: number;

  @IsOptional()
  @IsUUID()
  geoZoneId?: string;
}
