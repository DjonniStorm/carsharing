import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class GeoJsonPolygonDto {
  @ApiProperty({ example: 'Polygon' })
  type: 'Polygon';

  @ApiProperty({
    description: 'Array of linear rings. Each ring is [longitude, latitude] coordinate tuples.',
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
  @ApiProperty()
  @IsString()
  brand: string;

  @ApiProperty()
  @IsString()
  model: string;

  @ApiProperty()
  @IsString()
  plateNumber: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'IN_USE', 'BLOCKED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'IN_USE', 'BLOCKED'])
  status?: 'ACTIVE' | 'IN_USE' | 'BLOCKED';
}

export class CreateTariffDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  pricePerMinute: number;
}

export class UpdateTariffDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pricePerMinute?: number;
}

export class CreateZoneDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['ALLOWED', 'PARKING', 'RESTRICTED'] })
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

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}

export class UpdateZoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['ALLOWED', 'PARKING', 'RESTRICTED'] })
  @IsOptional()
  @IsIn(['ALLOWED', 'PARKING', 'RESTRICTED'])
  type?: 'ALLOWED' | 'PARKING' | 'RESTRICTED';

  @ApiPropertyOptional({ description: 'GeoJSON Polygon compatible with PostGIS.' })
  @IsOptional()
  geometry?: GeoJsonPolygonDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
