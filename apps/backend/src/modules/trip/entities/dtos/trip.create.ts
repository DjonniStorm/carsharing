import {
  IsEnum,
  IsNotEmpty,
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
 * Создание поездки (старт сессии): пользователь, авто, **версия тарифа** (геоверсия зоны со ставками), опционально снимок машины для чеков/истории.
 */
export class TripCreate {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  carId: string;

  @IsNotEmpty()
  @IsUUID()
  tariffVersionId: string;

  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  startLat?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  startLng?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  carPlateSnapshot?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  carDisplayNameSnapshot?: string;
}
