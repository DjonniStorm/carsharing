import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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
  @MinLength(1)
  @MaxLength(2048)
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerMinute: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerKm: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pausePricePerMinute?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
