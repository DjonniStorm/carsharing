import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { violationTitleFromKind } from '@carsharing/notification';

import { NotificationService } from 'src/shared/notification/notification.service';
import { TripNotFoundException } from 'src/modules/trip/common/errors';
import { TripService } from 'src/modules/trip/services/trip.service';
import { UserService } from 'src/modules/user/services/user.service';
import {
  IViolationRepositoryToken,
  type IViolationRepository,
} from 'src/modules/violation/repositories/violation.repository.interface';
import type { ViolationEntity } from 'src/modules/violation/entities/violation.entity';

import { ManagerNoticeDeliveryStatus } from '../entities/notification-delivery.status';
import type { ManagerViolationNoticeReadDto } from '../entities/dtos/manager-violation-notice.read';
import type { ManagerViolationNoticeSendDto } from '../entities/dtos/manager-violation-notice.send';
import type { TripNotificationReadDto } from '../entities/dtos/trip-notification.read';
import {
  ITripNotificationRepositoryToken,
  type ITripNotificationRepository,
} from '../repositories/trip-notification.repository.interface';

const NOTICE_PAYLOAD_KIND = 'manager_violation_notice' as const;

@Injectable()
export class ManagerViolationNoticeService {
  private readonly logger = new Logger(ManagerViolationNoticeService.name);

  constructor(
    private readonly tripService: TripService,
    private readonly userService: UserService,
    @Inject(IViolationRepositoryToken)
    private readonly violationRepository: IViolationRepository,
    @Inject(ITripNotificationRepositoryToken)
    private readonly tripNotificationRepository: ITripNotificationRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async listByTripId(tripId: string): Promise<TripNotificationReadDto[]> {
    const rows = await this.tripNotificationRepository.findAllByTripId(tripId);
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      tripId: r.tripId,
      message: r.message,
      status: r.status,
      violationIds: r.violationIds,
    }));
  }

  async sendNotice(
    dto: ManagerViolationNoticeSendDto,
  ): Promise<ManagerViolationNoticeReadDto> {
    const violationIds = [...new Set(dto.violationIds)];

    let tripRead;
    try {
      tripRead = await this.tripService.findById(dto.tripId);
    } catch (e) {
      if (e instanceof TripNotFoundException) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }

    const driver = await this.userService.findById(tripRead.userId);
    if (!driver) {
      throw new NotFoundException(`User ${tripRead.userId} not found`);
    }
    const email = driver.email?.trim();
    if (!email) {
      throw new BadRequestException('У водителя не указан email');
    }

    const violations: ViolationEntity[] = [];
    for (const id of violationIds) {
      const v = await this.violationRepository.findById(id);
      if (!v) {
        throw new BadRequestException(`Нарушение ${id} не найдено`);
      }
      if (v.tripId !== dto.tripId) {
        throw new BadRequestException(
          `Нарушение ${id} не относится к поездке ${dto.tripId}`,
        );
      }
      violations.push(v);
    }

    const storedPayload = {
      kind: NOTICE_PAYLOAD_KIND,
      version: 1,
      subject: dto.subject,
      message: dto.message,
      tripId: dto.tripId,
      violationIds,
    };
    const messageJson = JSON.stringify(storedPayload);

    let notificationId: number;
    try {
      const created = await this.tripNotificationRepository.createWithViolations({
        userId: tripRead.userId,
        tripId: dto.tripId,
        message: messageJson,
        status: ManagerNoticeDeliveryStatus.PENDING,
        violationIds,
      });
      notificationId = created.id;
    } catch (err) {
      this.logger.error('createWithViolations failed', err);
      throw err;
    }

    const description = this.buildEmailDescription(dto.message, violations);

    try {
      await this.notificationService.sendViolationNotice({
        to: email,
        title: dto.subject,
        description,
        tripId: dto.tripId,
        occurredAt: tripRead.startedAt,
        violationSummary: this.summarizeViolationsForEmail(violations),
      });
      await this.tripNotificationRepository.updateStatus(
        notificationId,
        ManagerNoticeDeliveryStatus.SENT,
      );
      return {
        notificationId,
        deliveryStatus: ManagerNoticeDeliveryStatus.SENT,
        violationIds,
        sentToEmail: email,
      };
    } catch (err) {
      this.logger.error(
        `Manager notice email failed notificationId=${String(notificationId)}`,
        err,
      );
      await this.tripNotificationRepository.updateStatus(
        notificationId,
        ManagerNoticeDeliveryStatus.FAILED,
      );
      return {
        notificationId,
        deliveryStatus: ManagerNoticeDeliveryStatus.FAILED,
        violationIds,
        sentToEmail: email,
        failureReason:
          err instanceof Error ? err.message : String(err),
      };
    }
  }

  private buildEmailDescription(
    managerMessage: string,
    violations: ViolationEntity[],
  ): string {
    const lines = violations.map((v) => {
      const typeLabel = violationTitleFromKind(v.type as unknown as number);
      return `— ${typeLabel}: ${v.description} (id: ${v.id})`;
    });
    return [managerMessage, '', 'Выбранные нарушения:', ...lines].join('\n');
  }

  private summarizeViolationsForEmail(violations: ViolationEntity[]): {
    total: number;
    byKind: Array<{ kind: number; count: number }>;
  } {
    const map = new Map<number, number>();
    for (const v of violations) {
      const kind = v.type as unknown as number;
      map.set(kind, (map.get(kind) ?? 0) + 1);
    }
    return {
      total: violations.length,
      byKind: [...map.entries()].map(([kind, count]) => ({ kind, count })),
    };
  }
}
