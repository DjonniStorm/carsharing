import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Патч полей шаблона тарифа.
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
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pausePricePerMinute?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
