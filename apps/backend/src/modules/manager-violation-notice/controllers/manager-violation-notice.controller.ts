import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import {
  ADMIN_ROLES,
  ALL_APP_ROLES,
} from 'src/modules/auth/roles.constants';
import type { AuthenticatedUser } from 'src/modules/auth/types/authenticated-user';
import { TripNotFoundException } from 'src/modules/trip/common/errors';
import { TripService } from 'src/modules/trip/services/trip.service';

import { ManagerViolationNoticeReadDto } from '../entities/dtos/manager-violation-notice.read';
import { ManagerViolationNoticeSendDto } from '../entities/dtos/manager-violation-notice.send';
import { TripNotificationReadDto } from '../entities/dtos/trip-notification.read';
import { ManagerViolationNoticeService } from '../services/manager-violation-notice.service';

/**
 * Уведомления водителю по выбранным нарушениям поездки (email).
 * Данные сохраняются в `notification` + `violation_notification`.
 */
@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class ManagerViolationNoticeController {
  constructor(
    private readonly managerViolationNoticeService: ManagerViolationNoticeService,
    private readonly tripService: TripService,
  ) {}

  @Get('trip/:tripId')
  @Roles(...ALL_APP_ROLES)
  @ApiOperation({
    summary:
      'Все уведомления по поездке (с привязкой `trip_id` и списком нарушений)',
  })
  @ApiResponse({ status: 200, type: [TripNotificationReadDto] })
  async listByTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ): Promise<TripNotificationReadDto[]> {
    try {
      await this.tripService.ensureTripAccessForUser(user.role, user.id, tripId);
    } catch (e) {
      if (e instanceof ForbiddenException) {
        throw e;
      }
      if (e instanceof TripNotFoundException) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
    return this.managerViolationNoticeService.listByTripId(tripId);
  }

  @Post('manager/violation-notice')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...ADMIN_ROLES)
  @ApiOperation({
    summary:
      'Отправить письмо водителю по выбранным нарушениям поездки (только менеджер / админ)',
  })
  @ApiResponse({ status: 201, type: ManagerViolationNoticeReadDto })
  async sendViolationNotice(
    @Body() body: ManagerViolationNoticeSendDto,
  ): Promise<ManagerViolationNoticeReadDto> {
    return this.managerViolationNoticeService.sendNotice(body);
  }
}
