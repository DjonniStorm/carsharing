import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
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
import { TripNotFoundException } from '../common/errors';
import {
  TripHistoryRead,
  TripHistoryShortInfoRead,
} from '../entities/dtos/trip.history.read';
import { TripService } from '../services/trip.service';

@Controller('trip-history')
@ApiTags('Trip History')
@ApiBearerAuth()
export class TripHistoryController {
  constructor(private readonly tripService: TripService) {}

  @Get()
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({
    summary:
      'Список поездок в формате истории (trip + car + violations). Для DRIVER — только свои; MANAGER/SYSTEM_ADMIN могут указать userId.',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description:
      'Только для MANAGER/SYSTEM_ADMIN: чья история; без параметра — история текущего пользователя.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Максимум записей (по умолчанию 100)',
  })
  @ApiQuery({ name: 'offset', required: false, description: 'Смещение' })
  @ApiResponse({ status: 200, type: [TripHistoryShortInfoRead] })
  async listHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('userId') userId?: string,
    @Query('limit') rawLimit?: string,
    @Query('offset') rawOffset?: string,
  ): Promise<TripHistoryShortInfoRead[]> {
    const effectiveUserId = resolveHistoryUserId(user, userId);
    const limit = parseOptionalNonNegativeInt(rawLimit, 'limit');
    const offset = parseOptionalNonNegativeInt(rawOffset, 'offset');
    return this.tripService.getTripHistoryShortInfoList(effectiveUserId, {
      ...(limit !== undefined ? { limit } : {}),
      ...(offset !== undefined ? { offset } : {}),
    });
  }

  @Get(':tripId/full')
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({
    summary:
      'Полная карточка поездки для истории (trip + car + violations + телеметрия)',
  })
  @ApiResponse({ status: 200, type: TripHistoryRead })
  @ApiResponse({ status: 404, description: 'Поездка не найдена' })
  @ApiResponse({ status: 403, description: 'Нет доступа к поездке' })
  async getHistoryFull(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ): Promise<TripHistoryRead> {
    try {
      await this.tripService.ensureTripAccessForUser(user.role, user.id, tripId);
      return await this.tripService.getTripHistoryFullInfo(tripId);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof TripNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Get(':tripId')
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({
    summary:
      'Одна поездка в формате истории без телеметрии (trip + car + violations)',
  })
  @ApiResponse({ status: 200, type: TripHistoryShortInfoRead })
  @ApiResponse({ status: 404, description: 'Поездка не найдена' })
  @ApiResponse({ status: 403, description: 'Нет доступа к поездке' })
  async getHistoryShort(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ): Promise<TripHistoryShortInfoRead> {
    try {
      await this.tripService.ensureTripAccessForUser(user.role, user.id, tripId);
      return await this.tripService.getTripHistoryShortInfo(tripId);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof TripNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}

function resolveHistoryUserId(
  user: AuthenticatedUser,
  queryUserId: string | undefined,
): string {
  if (user.role === UserRole.DRIVER) {
    if (
      queryUserId != null &&
      queryUserId !== '' &&
      queryUserId !== user.id
    ) {
      throw new ForbiddenException('Cannot list trip history for another user');
    }
    return user.id;
  }
  return queryUserId != null && queryUserId !== '' ? queryUserId : user.id;
}

function parseOptionalNonNegativeInt(
  raw: string | undefined,
  field: string,
): number | undefined {
  if (raw == null || raw.trim() === '') {
    return undefined;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new BadRequestException(`${field} must be a non-negative integer`);
  }
  return n;
}
