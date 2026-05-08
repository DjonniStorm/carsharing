import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  DatabaseTelemetryErrorException,
  TelemetryNotFoundException,
  TelemetryRelationNotFoundException,
} from '../common/errors';
import { TelemetryCreate } from '../entities/dto/telemetry.create';
import { TelemetryRead } from '../entities/dto/telemetry.read';
import {
  type ITelemetryService,
  ITelemetryServiceToken,
} from '../services/telemetry.service.interface';
import { ITelemetryController } from './telemetry.controller.interface';
import { parseDateQuery, parseIntQuery } from 'src/modules/tariff/common/utils';

@Controller('telemetry')
@ApiTags('Telemetry')
export class TelemetryController implements ITelemetryController {
  private readonly logger = new Logger(TelemetryController.name);

  constructor(
    @Inject(ITelemetryServiceToken)
    private readonly telemetryService: ITelemetryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Создать запись телеметрии' })
  @ApiResponse({ status: 201, type: TelemetryRead })
  async create(@Body() input: TelemetryCreate): Promise<TelemetryRead> {
    this.logger.debug('create telemetry', { tripId: input.tripId });
    try {
      return await this.telemetryService.create(input);
    } catch (error) {
      if (error instanceof TelemetryRelationNotFoundException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof DatabaseTelemetryErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить телеметрию по id' })
  @ApiResponse({ status: 200, type: TelemetryRead })
  async findById(@Param('id') id: string): Promise<TelemetryRead> {
    this.logger.debug('findById telemetry', { id });
    try {
      return await this.telemetryService.findById(id);
    } catch (error) {
      if (error instanceof TelemetryNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof TelemetryRelationNotFoundException ||
        error instanceof DatabaseTelemetryErrorException
      ) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Get('trip/:tripId')
  @ApiOperation({ summary: 'Получить телеметрию по tripId' })
  @ApiQuery({ name: 'timeFrom', required: false, type: String })
  @ApiQuery({ name: 'timeTo', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, type: [TelemetryRead] })
  async findManyByTripId(
    @Param('tripId') tripId: string,
    @Query('timeFrom') timeFrom?: string,
    @Query('timeTo') timeTo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ): Promise<TelemetryRead[]> {
    this.logger.debug('findManyByTripId telemetry', { tripId });
    const parsedFrom = parseDateQuery(timeFrom, 'timeFrom');
    const parsedTo = parseDateQuery(timeTo, 'timeTo');
    const parsedLimit = parseIntQuery(limit, 'limit');
    const parsedOffset = parseIntQuery(offset, 'offset');
    const parsedSort = sort === 'desc' ? 'desc' : 'asc';
    try {
      return await this.telemetryService.findManyByTripId(
        tripId,
        parsedFrom,
        parsedTo,
        parsedLimit,
        parsedOffset,
        parsedSort,
      );
    } catch (error) {
      if (
        error instanceof TelemetryRelationNotFoundException ||
        error instanceof DatabaseTelemetryErrorException
      ) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
