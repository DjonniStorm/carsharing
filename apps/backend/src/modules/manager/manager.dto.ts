import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GeoJsonPolygonDto {
  @ApiProperty({ example: 'Polygon', description: 'Тип геометрии GeoJSON' })
  type: 'Polygon';

  @ApiProperty({
    description:
      'Массив линейных колец. Каждое кольцо содержит координаты в формате [долгота, широта].',
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'number' },
      },
    },
  })
  coordinates: number[][][];
}

export class CreateVehicleDto {
  @ApiProperty({ description: 'Марка автомобиля' })
  @IsString()
  brand: string;

  @ApiProperty({ description: 'Модель автомобиля' })
  @IsString()
  model: string;

  @ApiProperty({ description: 'Государственный номер автомобиля' })
  @IsString()
  plateNumber: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({
    enum: ['ACTIVE', 'IN_USE', 'BLOCKED'],
    description: 'Новый статус автомобиля',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'IN_USE', 'BLOCKED'])
  status?: 'ACTIVE' | 'IN_USE' | 'BLOCKED';
}

export class CreateTariffDto {
  @ApiProperty({ description: 'Название тарифа' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Стоимость минуты поездки' })
  @IsNumber()
  pricePerMinute: number;
}

export class UpdateTariffDto {
  @ApiPropertyOptional({ description: 'Новое название тарифа' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Новая стоимость минуты поездки' })
  @IsOptional()
  @IsNumber()
  pricePerMinute?: number;
}

export class CreateZoneDto {
  @ApiProperty({ description: 'Название зоны' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: ['ALLOWED', 'PARKING', 'RESTRICTED'],
    description: 'Тип зоны',
  })
  @IsIn(['ALLOWED', 'PARKING', 'RESTRICTED'])
  type: 'ALLOWED' | 'PARKING' | 'RESTRICTED';

  @ApiProperty({
    description:
      'GeoJSON Polygon compatible with PostGIS geometry(Polygon, 4326). Example: { "type":"Polygon", "coordinates":[[[30.1,50.4],[30.2,50.4],[30.2,50.5],[30.1,50.4]]] }',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [30.1, 50.4],
          [30.2, 50.4],
          [30.2, 50.5],
          [30.1, 50.4],
        ],
      ],
    },
  })
  geometry: GeoJsonPolygonDto;

  @ApiProperty({ description: 'Признак активности зоны' })
  @IsBoolean()
  isActive: boolean;
}

export class UpdateZoneDto {
  @ApiPropertyOptional({ description: 'Новое название зоны' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: ['ALLOWED', 'PARKING', 'RESTRICTED'],
    description: 'Новый тип зоны',
  })
  @IsOptional()
  @IsIn(['ALLOWED', 'PARKING', 'RESTRICTED'])
  type?: 'ALLOWED' | 'PARKING' | 'RESTRICTED';

  @ApiPropertyOptional({
    description: 'GeoJSON Polygon compatible with PostGIS.',
  })
  @IsOptional()
  geometry?: GeoJsonPolygonDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
