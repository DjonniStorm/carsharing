import { describe, expect, it, vi } from 'vitest';

import { NotificationService } from 'src/shared/notification/notification.service';
import type { IViolationRepository } from 'src/modules/violation/repositories/violation.repository.interface';
import { TripService } from 'src/modules/trip/services/trip.service';
import { UserService } from 'src/modules/user/services/user.service';

import { ManagerNoticeDeliveryStatus } from '../entities/notification-delivery.status';
import type { ITripNotificationRepository } from '../repositories/trip-notification.repository.interface';
import { ManagerViolationNoticeService } from './manager-violation-notice.service';

describe('ManagerViolationNoticeService', () => {
  describe('listByTripId', () => {
    it('маппит сущности репозитория в DTO', async () => {
      const tripId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const findAllByTripId = vi.fn().mockResolvedValue([
        {
          id: 10,
          userId: 'user-1',
          tripId,
          message: '{}',
          status: ManagerNoticeDeliveryStatus.SENT,
          violationIds: ['v1', 'v2'],
        },
      ]);
      const tripNotificationRepository: ITripNotificationRepository = {
        createWithViolations: vi.fn(),
        updateStatus: vi.fn(),
        deleteById: vi.fn(),
        findAllByTripId,
      };

      const service = new ManagerViolationNoticeService(
        {} as TripService,
        {} as UserService,
        {} as IViolationRepository,
        tripNotificationRepository,
        {} as NotificationService,
      );

      const list = await service.listByTripId(tripId);

      expect(findAllByTripId).toHaveBeenCalledWith(tripId);
      expect(list).toEqual([
        {
          id: 10,
          userId: 'user-1',
          tripId,
          message: '{}',
          status: ManagerNoticeDeliveryStatus.SENT,
          violationIds: ['v1', 'v2'],
        },
      ]);
    });
  });
});
