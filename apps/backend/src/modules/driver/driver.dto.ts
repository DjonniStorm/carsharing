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
  @ApiProperty({ minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;

  @ApiPropertyOptional({ default: 1000 })
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
  @ApiProperty()
  @IsNumber()
  endLat: number;

  @ApiProperty()
  @IsNumber()
  endLon: number;
}

export class CancelTripDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class DriverTripsQueryDto {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'FINISHED', 'CANCELLED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'FINISHED', 'CANCELLED'])
  status?: 'ACTIVE' | 'FINISHED' | 'CANCELLED';
}
