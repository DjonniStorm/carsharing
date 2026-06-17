import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ALL_APP_ROLES } from 'src/modules/auth/roles.constants';
import type { AuthenticatedUser } from 'src/modules/auth/types/authenticated-user';
import { CarNotFoundException } from 'src/modules/car/common/errors';
import { CarService } from 'src/modules/car/services/car.service';
import { TripNotFoundException } from 'src/modules/trip/common/errors';
import { TripStatus } from 'src/modules/trip/entities/trip.status';
import { TripService } from 'src/modules/trip/services/trip.service';
import { parseDateQuery, parseIntQuery } from 'src/modules/tariff/common/utils';

import {
  DatabaseTelemetryErrorException,
  TelemetryNotFoundException,
  TelemetryRelationNotFoundException,
} from '../common/errors';
import { TelemetryCreate } from '../entities/dto/telemetry.create';
import {
  TelemetryDevicePoint,
  TelemetryDevicePosition,
} from '../entities/dto/telemetry-device';
import { TelemetryRead } from '../entities/dto/telemetry.read';
import {
  type ITelemetryService,
  ITelemetryServiceToken,
} from '../services/telemetry.service.interface';
import { ITelemetryController } from './telemetry.controller.interface';

@Controller('telemetry')
@ApiTags('Telemetry')
@ApiBearerAuth()
export class TelemetryController implements ITelemetryController {
  private readonly logger = new Logger(TelemetryController.name);

  constructor(
    @Inject(ITelemetryServiceToken)
    private readonly telemetryService: ITelemetryService,
    private readonly tripService: TripService,
    private readonly carService: CarService,
  ) {}

  private ensureDeviceKey(rawKey: string | undefined): void {
    const expected = process.env.TELEMETRY_DEVICE_KEY;
    if (!expected) {
      throw new ForbiddenException('Telemetry device ingest is disabled');
    }
    if (rawKey !== expected) {
      throw new ForbiddenException('Invalid telemetry device key');
    }
  }

  private async findActiveTripForCar(carId: string) {
    const [active] = await this.tripService.findMany({
      carId,
      status: TripStatus.ACTIVE,
    });
    return active ?? null;
  }

  @Get('cars/:carId/active-trip')
  @Public()
  @ApiOperation({ summary: 'Find active trip for telemetry device car id' })
  async findActiveTripByCarForDevice(
    @Headers('x-telemetry-key') key: string | undefined,
    @Param('carId') carId: string,
  ) {
    this.ensureDeviceKey(key);
    await this.carService.findById(carId);
    return this.findActiveTripForCar(carId);
  }

  @Get('cars/:carId/car')
  @Public()
  @ApiOperation({ summary: 'Find car for telemetry device car id' })
  async findCarForDevice(
    @Headers('x-telemetry-key') key: string | undefined,
    @Param('carId') carId: string,
  ) {
    this.ensureDeviceKey(key);
    return this.carService.findById(carId);
  }

  @Post('cars/:carId/position')
  @Public()
  @ApiOperation({ summary: 'Update idle car position from telemetry device' })
  async updateCarPositionFromDevice(
    @Headers('x-telemetry-key') key: string | undefined,
    @Param('carId') carId: string,
    @Body() input: TelemetryDevicePosition,
  ) {
    this.ensureDeviceKey(key);
    try {
      return await this.carService.updatePosition(
        carId,
        input.lat,
        input.lon,
        new Date(input.positionAt),
      );
    } catch (error) {
      if (error instanceof CarNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  @Post('cars/:carId')
  @Public()
  @ApiOperation({ summary: 'Create telemetry point from device car id' })
  async createFromDeviceCar(
    @Headers('x-telemetry-key') key: string | undefined,
    @Param('carId') carId: string,
    @Body() input: TelemetryDevicePoint,
  ): Promise<TelemetryRead> {
    this.ensureDeviceKey(key);
    try {
      await this.carService.findById(carId);
      const trip = await this.findActiveTripForCar(carId);
      if (!trip) {
        throw new NotFoundException(`Active trip for car ${carId} not found`);
      }
      return await this.telemetryService.create({
        ...input,
        tripId: trip.id,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      if (error instanceof CarNotFoundException) {
        throw new NotFoundException(error.message);
      }
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

  @Post()
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({ summary: 'Создать запись телеметрии' })
  @ApiResponse({ status: 201, type: TelemetryRead })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: TelemetryCreate,
  ): Promise<TelemetryRead> {
    this.logger.debug('create telemetry', { tripId: input.tripId });
    try {
      await this.tripService.ensureTripAccessForUser(
        user.role,
        user.id,
        input.tripId,
      );
      return await this.telemetryService.create(input);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof TripNotFoundException) {
        throw new NotFoundException(error.message);
      }
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

  @Get('trip/:tripId')
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({ summary: 'Получить телеметрию по tripId' })
  @ApiQuery({ name: 'timeFrom', required: false, type: String })
  @ApiQuery({ name: 'timeTo', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, type: [TelemetryRead] })
  async findManyByTripId(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Query('timeFrom') timeFrom?: string,
    @Query('timeTo') timeTo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ): Promise<TelemetryRead[]> {
    this.logger.debug('findManyByTripId telemetry', { tripId });
    try {
      await this.tripService.ensureTripAccessForUser(
        user.role,
        user.id,
        tripId,
      );
      const parsedFrom = parseDateQuery(timeFrom, 'timeFrom');
      const parsedTo = parseDateQuery(timeTo, 'timeTo');
      const parsedLimit = parseIntQuery(limit, 'limit');
      const parsedOffset = parseIntQuery(offset, 'offset');
      const parsedSort = sort === 'desc' ? 'desc' : 'asc';
      return await this.telemetryService.findManyByTripId(
        tripId,
        parsedFrom,
        parsedTo,
        parsedLimit,
        parsedOffset,
        parsedSort,
      );
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof TripNotFoundException) {
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

  @Get(':id')
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({ summary: 'Получить телеметрию по id' })
  @ApiResponse({ status: 200, type: TelemetryRead })
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<TelemetryRead> {
    this.logger.debug('findById telemetry', { id });
    try {
      const row = await this.telemetryService.findById(id);
      await this.tripService.ensureTripAccessForUser(
        user.role,
        user.id,
        row.tripId,
      );
      return row;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof TripNotFoundException) {
        throw new NotFoundException(error.message);
      }
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
}
