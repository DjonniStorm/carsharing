import { FIELD_LIMITS } from '@carsharing/validation';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Создание шаблона тарифа (глобальный пресет).
 */
export class TariffCreate {
  @IsNotEmpty()
  @IsString()
  @MinLength(FIELD_LIMITS.TARIFF_NAME_MIN)
  @MaxLength(FIELD_LIMITS.TARIFF_NAME_MAX)
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(FIELD_LIMITS.TARIFF_PRICE_MAX)
  pricePerMinute: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(FIELD_LIMITS.TARIFF_PRICE_MAX)
  pricePerKm: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(FIELD_LIMITS.TARIFF_PRICE_MAX)
  pausePricePerMinute?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
