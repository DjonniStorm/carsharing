import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Создание тарифа для геозоны.
 */
export class TariffCreate {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerMinute: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerKm: number;

  @IsNotEmpty()
  @IsUUID()
  geoZoneId: string;
}
