import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseFloatPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  DatabaseGeozoneErrorException,
  GeozoneAlreadyDeletedException,
  GeozoneCreatedByUserIdRequiredException,
  GeozoneNotDeletedException,
  GeozoneNotFoundException,
  GeozoneVersionNotFoundException,
} from '../common/errors';
import { GeozoneCreate } from '../entities/dtos/geozone.create';
import { GeozoneRead } from '../entities/dtos/geozone.read';
import { GeozoneUpdate } from '../entities/dtos/geozone.update';
import { GeozoneVersionCreate } from '../entities/dtos/geozone-version.create';
import { GeozoneVersionRead } from '../entities/dtos/geozone-version.read';
import { GeozoneType } from '../entities/geozone.type';
import { GeozoneService } from '../services/geozone.service';
import { IGeozoneController } from './geozone.controller.interface';

function parseGeozoneTypesQuery(raw: string | undefined): GeozoneType[] {
  if (raw == null || raw.trim() === '') {
    return [];
  }
  const allowed = new Set<string>(Object.values(GeozoneType));
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && allowed.has(part)) as GeozoneType[];
}

@Controller('geozones')
@ApiTags('Geozones')
export class GeozoneController implements IGeozoneController {
  private readonly logger = new Logger(GeozoneController.name);
  constructor(private readonly geozoneService: GeozoneService) {}

  @Get('bounding-box')
  @ApiOperation({
    summary: 'Геозоны, текущая геометрия которых пересекает прямоугольник',
  })
  @ApiQuery({ name: 'minLon', type: Number, required: true })
  @ApiQuery({ name: 'minLat', type: Number, required: true })
  @ApiQuery({ name: 'maxLon', type: Number, required: true })
  @ApiQuery({ name: 'maxLat', type: Number, required: true })
  @ApiQuery({ name: 'includeDeleted', type: Boolean, required: false })
  @ApiQuery({
    name: 'types',
    required: false,
    description: 'Через запятую: RENTAL,PARKING,OTHER',
  })
  @ApiResponse({ status: 200, type: [GeozoneRead] })
  async findInBoundingBox(
    @Query('minLon', ParseFloatPipe) minLon: number,
    @Query('minLat', ParseFloatPipe) minLat: number,
    @Query('maxLon', ParseFloatPipe) maxLon: number,
    @Query('maxLat', ParseFloatPipe) maxLat: number,
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    includeDeleted: boolean,
    @Query('types', new DefaultValuePipe('')) types: string,
  ): Promise<GeozoneRead[]> {
    const parsedTypes = parseGeozoneTypesQuery(types);
    this.logger.debug('findInBoundingBox', {
      minLon,
      minLat,
      maxLon,
      maxLat,
      includeDeleted,
      types: parsedTypes,
    });
    try {
      return await this.geozoneService.findInBoundingBox({
        minLon,
        minLat,
        maxLon,
        maxLat,
        includeDeleted,
        types: parsedTypes.length > 0 ? parsedTypes : undefined,
      });
    } catch (error) {
      this.logger.error('Failed to find geozones in bounding box', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Get('containing-point')
  @ApiOperation({
    summary: 'Геозоны, внутри текущей геометрии которых лежит точка',
  })
  @ApiQuery({ name: 'lon', type: Number, required: true })
  @ApiQuery({ name: 'lat', type: Number, required: true })
  @ApiQuery({ name: 'includeDeleted', type: Boolean, required: false })
  @ApiQuery({
    name: 'types',
    required: false,
    description: 'Через запятую: RENTAL,PARKING,OTHER',
  })
  @ApiResponse({ status: 200, type: [GeozoneRead] })
  async findContainingPoint(
    @Query('lon', ParseFloatPipe) lon: number,
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    includeDeleted: boolean,
    @Query('types', new DefaultValuePipe('')) types: string,
  ): Promise<GeozoneRead[]> {
    const parsedTypes = parseGeozoneTypesQuery(types);
    this.logger.debug('findContainingPoint', {
      lon,
      lat,
      includeDeleted,
      types: parsedTypes,
    });
    try {
      return await this.geozoneService.findContainingPoint({
        lon,
        lat,
        includeDeleted,
        types: parsedTypes.length > 0 ? parsedTypes : undefined,
      });
    } catch (error) {
      this.logger.error('Failed to find geozones containing point', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Получить все геозоны' })
  @ApiQuery({ name: 'includeDeleted', type: Boolean, required: false })
  @ApiResponse({ status: 200, type: [GeozoneRead] })
  async findAll(
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    includeDeleted: boolean,
  ): Promise<GeozoneRead[]> {
    this.logger.debug('findAll', { includeDeleted });
    try {
      return await this.geozoneService.findAll({ includeDeleted });
    } catch (error) {
      this.logger.error('Failed to find all geozones', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать геозону' })
  @ApiQuery({
    name: 'createdByUserId',
    required: false,
    description:
      'Если нет в теле и нет контекста авторизации — можно передать здесь (временно для разработки)',
  })
  @ApiResponse({ status: 201, type: GeozoneRead })
  async create(
    @Body() geozone: GeozoneCreate,
    @Query('createdByUserId') createdByUserIdFromQuery?: string,
  ): Promise<GeozoneRead> {
    if (!geozone.createdByUserId?.trim() && createdByUserIdFromQuery?.trim()) {
      geozone.createdByUserId = createdByUserIdFromQuery.trim();
    }
    this.logger.debug('create', { name: geozone.name });
    try {
      return await this.geozoneService.create(geozone);
    } catch (error) {
      this.logger.error('Failed to create geozone', error);
      if (error instanceof GeozoneCreatedByUserIdRequiredException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof DatabaseGeozoneErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Get(':id/versions/:versionId')
  @ApiOperation({
    summary: 'Получить версию геозоны по ID (проверяется принадлежность зоне)',
  })
  @ApiResponse({ status: 200, type: GeozoneVersionRead })
  async findVersionById(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ): Promise<GeozoneVersionRead> {
    this.logger.debug('findVersionById', { id, versionId });
    try {
      const version = await this.geozoneService.findVersionById(versionId);
      if (version.geozoneId !== id) {
        throw new NotFoundException('Версия не принадлежит указанной геозоне');
      }
      return version;
    } catch (error) {
      this.logger.error('Failed to find geozone version by ID', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof GeozoneVersionNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Получить версии геозоны' })
  @ApiResponse({ status: 200, type: [GeozoneVersionRead] })
  async findVersions(@Param('id') id: string): Promise<GeozoneVersionRead[]> {
    this.logger.debug('findVersions', { id });
    try {
      return await this.geozoneService.findVersions(id);
    } catch (error) {
      this.logger.error('Failed to find geozone versions', error);
      if (error instanceof GeozoneNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Восстановить геозону' })
  @ApiResponse({ status: 200, type: GeozoneRead })
  async restore(@Param('id') id: string): Promise<GeozoneRead> {
    this.logger.debug('restore', { id });
    try {
      return await this.geozoneService.restore(id);
    } catch (error) {
      this.logger.error('Failed to restore geozone', error);
      if (error instanceof GeozoneNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof GeozoneNotDeletedException) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Post(':id/publish-version')
  @ApiOperation({ summary: 'Опубликовать новую версию геометрии' })
  @ApiResponse({ status: 200, type: GeozoneRead })
  async publishVersion(
    @Param('id') id: string,
    @Body() version: GeozoneVersionCreate,
  ): Promise<GeozoneRead> {
    this.logger.debug('publishVersion', { id });
    try {
      return await this.geozoneService.publishVersion(id, version);
    } catch (error) {
      this.logger.error('Failed to publish geozone version', error);
      if (error instanceof GeozoneNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить поля геозоны' })
  @ApiResponse({ status: 200, type: GeozoneRead })
  async update(
    @Param('id') id: string,
    @Body() geozone: Partial<GeozoneUpdate>,
  ): Promise<GeozoneRead> {
    this.logger.debug('update', { id });
    try {
      return await this.geozoneService.update(id, geozone);
    } catch (error) {
      this.logger.error('Failed to update geozone', error);
      if (error instanceof GeozoneNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Софт-удаление геозоны' })
  @ApiResponse({ status: 200, type: GeozoneRead })
  async softDelete(@Param('id') id: string): Promise<GeozoneRead> {
    this.logger.debug('softDelete', { id });
    try {
      return await this.geozoneService.softDelete(id);
    } catch (error) {
      this.logger.error('Failed to soft-delete geozone', error);
      if (error instanceof GeozoneNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof GeozoneAlreadyDeletedException) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить геозону по ID' })
  @ApiResponse({ status: 200, type: GeozoneRead })
  async findById(@Param('id') id: string): Promise<GeozoneRead> {
    this.logger.debug('findById', { id });
    try {
      return await this.geozoneService.findById(id);
    } catch (error) {
      this.logger.error('Failed to find geozone by ID', error);
      if (error instanceof GeozoneNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
