import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import {
  ADMIN_ROLES,
  ALL_APP_ROLES,
} from 'src/modules/auth/roles.constants';

import {
  DatabaseTariffErrorException,
  TariffAlreadyDeletedException,
  TariffGeoZoneNotFoundException,
  TariffNotFoundException,
} from '../common/errors';
import { TariffCreate } from '../entities/dtos/tariff.create';
import { TariffRead } from '../entities/dtos/tariff.read';
import { TariffUpdate } from '../entities/dtos/tariff.update';
import { TariffService } from '../services/tariff.service';
import { ITariffController } from './tariff.controller.interface';

@Controller('tariffs')
@ApiTags('Tariffs')
@ApiBearerAuth()
export class TariffController implements ITariffController {
  private readonly logger = new Logger(TariffController.name);

  constructor(private readonly tariffService: TariffService) {}

  @Get()
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({ summary: 'Список тарифов' })
  @ApiResponse({ status: 200, description: 'Список тарифов' })
  async findAll(
    @Query('includeDeleted') includeDeleted: boolean = false,
    @Query('geoZoneId') geoZoneId?: string,
  ): Promise<TariffRead[]> {
    this.logger.debug('findAll', { includeDeleted, geoZoneId });
    try {
      return await this.tariffService.findMany({ includeDeleted, geoZoneId });
    } catch (error) {
      if (error instanceof DatabaseTariffErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Get(':id')
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({ summary: 'Тариф по id' })
  @ApiResponse({ status: 200, description: 'Тариф' })
  async findById(@Param('id') id: string): Promise<TariffRead> {
    this.logger.debug('findById', { id });
    try {
      return await this.tariffService.findById(id);
    } catch (error) {
      if (error instanceof TariffNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof DatabaseTariffErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Создать тариф' })
  @ApiResponse({ status: 201, description: 'Созданный тариф' })
  async create(@Body() tariff: TariffCreate): Promise<TariffRead> {
    this.logger.debug('create', { name: tariff.name });
    try {
      return await this.tariffService.create(tariff);
    } catch (error) {
      if (error instanceof TariffGeoZoneNotFoundException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof DatabaseTariffErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Обновить тариф' })
  @ApiResponse({ status: 200, description: 'Обновлённый тариф' })
  async update(
    @Param('id') id: string,
    @Body() tariff: TariffUpdate,
  ): Promise<TariffRead> {
    this.logger.debug('update', { id });
    try {
      return await this.tariffService.update(id, tariff);
    } catch (error) {
      if (error instanceof TariffNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof TariffGeoZoneNotFoundException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof DatabaseTariffErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Удалить тариф (soft delete)' })
  @ApiResponse({ status: 200, description: 'Тариф помечен удалённым' })
  async delete(@Param('id') id: string): Promise<TariffRead> {
    this.logger.debug('delete', { id });
    try {
      return await this.tariffService.delete(id);
    } catch (error) {
      if (error instanceof TariffNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof TariffAlreadyDeletedException) {
        throw new ConflictException(error.message);
      }
      if (error instanceof DatabaseTariffErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
