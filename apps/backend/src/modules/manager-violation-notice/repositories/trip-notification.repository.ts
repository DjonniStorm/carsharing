import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { TripNotificationEntity } from '../entities/trip-notification.entity';
import type {
  CreateTripNotificationWithViolationsInput,
  ITripNotificationRepository,
} from './trip-notification.repository.interface';

@Injectable()
export class TripNotificationRepository implements ITripNotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithViolations(
    input: CreateTripNotificationWithViolationsInput,
  ): Promise<{ id: number }> {
    const n = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        tripId: input.tripId,
        message: input.message,
        status: input.status,
      },
    });
    try {
      await this.prisma.violationNotification.createMany({
        data: input.violationIds.map((violationId) => ({
          violationId,
          notificationId: n.id,
        })),
      });
    } catch (e) {
      await this.prisma.notification.delete({ where: { id: n.id } });
      throw e;
    }
    return { id: n.id };
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { status },
    });
  }

  async deleteById(id: number): Promise<void> {
    await this.prisma.violationNotification.deleteMany({
      where: { notificationId: id },
    });
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  async findAllByTripId(tripId: string): Promise<TripNotificationEntity[]> {
    const rows = await this.prisma.notification.findMany({
      where: { tripId },
      include: {
        violations: {
          select: { violationId: true },
        },
      },
      orderBy: { id: 'desc' },
    });
    return rows.map((r) => {
      const e = new TripNotificationEntity();
      e.id = r.id;
      e.userId = r.userId;
      e.tripId = r.tripId;
      e.message = r.message;
      e.status = r.status;
      e.violationIds = r.violations.map((vn) => vn.violationId);
      return e;
    });
  }
}
