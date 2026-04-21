import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  DatabaseTripErrorException,
  TripNotFoundException,
  TripRelationNotFoundException,
} from '../common/errors';
import { TripCreate } from '../entities/dtos/trip.create';
import { TripRead } from '../entities/dtos/trip.read';
import { TripUpdate } from '../entities/dtos/trip.update';
import { TripStatus } from '../entities/trip.status';
import { TripService } from '../services/trip.service';
import { ITripController } from './trip.controller.interface';

function parseTripStatusQuery(raw: string | undefined): TripStatus | undefined {
  if (raw == null || raw.trim() === '') {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new BadRequestException('status must be an integer');
  }
  if (!(value in TripStatus)) {
    throw new BadRequestException('status has invalid value');
  }
  return value as TripStatus;
}

function parseDateQuery(
  raw: string | undefined,
  field: string,
): Date | undefined {
  if (raw == null || raw.trim() === '') {
    return undefined;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} must be a valid date`);
  }
  return parsed;
}

@Controller('trips')
@ApiTags('Trips')
export class TripController implements ITripController {
  private readonly logger = new Logger(TripController.name);

  constructor(private readonly tripService: TripService) {}

  @Get()
  @ApiOperation({ summary: 'Список поездок' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'carId', required: false })
  @ApiQuery({ name: 'tariffVersionId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Числовое значение TripStatus',
  })
  @ApiQuery({ name: 'startedAfter', required: false, type: String })
  @ApiQuery({ name: 'startedBefore', required: false, type: String })
  @ApiResponse({ status: 200, type: [TripRead] })
  async findAll(
    @Query('userId') userId?: string,
    @Query('carId') carId?: string,
    @Query('tariffVersionId') tariffVersionId?: string,
    @Query('status') rawStatus?: string,
    @Query('startedAfter') rawStartedAfter?: string,
    @Query('startedBefore') rawStartedBefore?: string,
  ): Promise<TripRead[]> {
    this.logger.debug('findAll', { userId, carId, tariffVersionId });
    const status = parseTripStatusQuery(rawStatus);
    const startedAfter = parseDateQuery(rawStartedAfter, 'startedAfter');
    const startedBefore = parseDateQuery(rawStartedBefore, 'startedBefore');

    if (
      startedAfter &&
      startedBefore &&
      startedAfter.getTime() > startedBefore.getTime()
    ) {
      throw new BadRequestException(
        'startedAfter must be less or equal startedBefore',
      );
    }

    try {
      return await this.tripService.findMany({
        userId,
        carId,
        tariffVersionId,
        status,
        startedAfter,
        startedBefore,
      });
    } catch (error) {
      if (
        error instanceof TripRelationNotFoundException ||
        error instanceof DatabaseTripErrorException
      ) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Поездка по id' })
  @ApiQuery({ name: 'withUser', required: false, type: Boolean })
  @ApiQuery({ name: 'withCar', required: false, type: Boolean })
  @ApiQuery({ name: 'withTariffVersion', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: TripRead })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @Query('withUser') withUser?: string,
    @Query('withCar') withCar?: string,
    @Query('withTariffVersion') withTariffVersion?: string,
  ): Promise<TripRead> {
    this.logger.debug('findById', { id, withUser, withCar, withTariffVersion });
    try {
      return await this.tripService.findById(id, {
        withUser: withUser === 'true',
        withCar: withCar === 'true',
        withTariffVersion: withTariffVersion === 'true',
      });
    } catch (error) {
      if (error instanceof TripNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof TripRelationNotFoundException ||
        error instanceof DatabaseTripErrorException
      ) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать поездку' })
  @ApiResponse({ status: 201, type: TripRead })
  async create(@Body() trip: TripCreate): Promise<TripRead> {
    this.logger.debug('create', { userId: trip.userId, carId: trip.carId });
    try {
      return await this.tripService.create(trip);
    } catch (error) {
      if (error instanceof TripRelationNotFoundException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof DatabaseTripErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить поездку' })
  @ApiResponse({ status: 200, type: TripRead })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() trip: TripUpdate,
  ): Promise<TripRead> {
    this.logger.debug('update', { id });
    try {
      return await this.tripService.update(id, trip);
    } catch (error) {
      if (error instanceof TripNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof TripRelationNotFoundException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof DatabaseTripErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
