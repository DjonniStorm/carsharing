import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class NearbyVehiclesQueryDto {
  @ApiProperty({
    minimum: -90,
    maximum: 90,
    description: 'Широта точки поиска',
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    minimum: -180,
    maximum: 180,
    description: 'Долгота точки поиска',
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;

  @ApiPropertyOptional({ default: 1000, description: 'Радиус поиска в метрах' })
  @IsOptional()
  @IsNumber()
  radiusMeters?: number;
}

export class StartTripDto {
  @ApiProperty({ description: 'Идентификатор автомобиля' })
  @IsNumber()
  vehicleId: number;

  @ApiProperty({ description: 'Идентификатор тарифа' })
  @IsNumber()
  tariffId: number;
}

export class FinishTripDto {
  @ApiProperty({ description: 'Широта точки завершения поездки' })
  @IsNumber()
  endLat: number;

  @ApiProperty({ description: 'Долгота точки завершения поездки' })
  @IsNumber()
  endLon: number;
}

export class CancelTripDto {
  @ApiProperty({ description: 'Причина отмены поездки' })
  @IsString()
  reason: string;
}

export class DriverTripsQueryDto {
  @ApiPropertyOptional({
    enum: ['ACTIVE', 'FINISHED', 'CANCELLED'],
    description: 'Фильтр по статусу поездки',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'FINISHED', 'CANCELLED'])
  status?: 'ACTIVE' | 'FINISHED' | 'CANCELLED';
}
