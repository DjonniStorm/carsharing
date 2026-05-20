import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
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
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ALL_APP_ROLES } from 'src/modules/auth/roles.constants';
import type { AuthenticatedUser } from 'src/modules/auth/types/authenticated-user';
import { UserRole } from 'src/modules/user/entities/user.role';
import {
  DatabaseTripErrorException,
  TripCarAlreadyInUseException,
  TripNotFoundException,
  TripRelationNotFoundException,
} from '../common/errors';
import { TripCreate } from '../entities/dtos/trip.create';
import { TripRead } from '../entities/dtos/trip.read';
import { TripUpdate } from '../entities/dtos/trip.update';
import { TripStatus } from '../entities/trip.status';
import { parseDateQuery } from 'src/shared/query/parse-date-query';
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

@Controller('trips')
@ApiTags('Trips')
@ApiBearerAuth()
export class TripController implements ITripController {
  private readonly logger = new Logger(TripController.name);

  constructor(private readonly tripService: TripService) {}

  @Get()
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({ summary: 'Список поездок' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'carId', required: false })
  @ApiQuery({ name: 'geoZoneVersionId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Числовое значение TripStatus',
  })
  @ApiQuery({ name: 'startedAfter', required: false, type: String })
  @ApiQuery({ name: 'startedBefore', required: false, type: String })
  @ApiResponse({ status: 200, type: [TripRead] })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('userId') userId?: string,
    @Query('carId') carId?: string,
    @Query('geoZoneVersionId') geoZoneVersionId?: string,
    @Query('status') rawStatus?: string,
    @Query('startedAfter') rawStartedAfter?: string,
    @Query('startedBefore') rawStartedBefore?: string,
  ): Promise<TripRead[]> {
    let effectiveUserId = userId;
    if (user.role === UserRole.DRIVER) {
      if (userId != null && userId !== '' && userId !== user.id) {
        throw new ForbiddenException('Cannot list trips for another user');
      }
      effectiveUserId = user.id;
    }

    this.logger.debug('findAll', {
      userId: effectiveUserId,
      carId,
      geoZoneVersionId,
    });
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
        userId: effectiveUserId,
        carId,
        geoZoneVersionId,
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
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({ summary: 'Поездка по id' })
  @ApiQuery({ name: 'withUser', required: false, type: Boolean })
  @ApiQuery({ name: 'withCar', required: false, type: Boolean })
  @ApiQuery({ name: 'withGeoZoneVersion', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: TripRead })
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('withUser') withUser?: string,
    @Query('withCar') withCar?: string,
    @Query('withGeoZoneVersion') withGeoZoneVersion?: string,
  ): Promise<TripRead> {
    this.logger.debug('findById', {
      id,
      withUser,
      withCar,
      withGeoZoneVersion,
    });
    try {
      await this.tripService.ensureTripAccessForUser(user.role, user.id, id);
      return await this.tripService.findById(id, {
        withUser: withUser === 'true',
        withCar: withCar === 'true',
        withGeoZoneVersion: withGeoZoneVersion === 'true',
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
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
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({ summary: 'Создать поездку' })
  @ApiResponse({ status: 201, type: TripRead })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() trip: TripCreate,
  ): Promise<TripRead> {
    if (user.role === UserRole.MANAGER) {
      throw new ForbiddenException('Manager cannot create trips');
    }

    if (user.role === UserRole.DRIVER) {
      if (
        trip.userId != null &&
        trip.userId !== '' &&
        trip.userId !== user.id
      ) {
        throw new ForbiddenException('Cannot create trip for another user');
      }
      trip.userId = user.id;
    }
    this.logger.debug('create', { userId: trip.userId, carId: trip.carId });
    try {
      return await this.tripService.create(trip);
    } catch (error) {
      if (error instanceof TripCarAlreadyInUseException) {
        throw new ConflictException(error.message);
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

  @Patch(':id')
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({ summary: 'Обновить поездку' })
  @ApiResponse({ status: 200, type: TripRead })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() trip: TripUpdate,
  ): Promise<TripRead> {
    this.logger.debug('update', { id });
    try {
      await this.tripService.ensureTripAccessForUser(user.role, user.id, id);
      return await this.tripService.update(id, trip);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
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
