import type { TripNotificationEntity } from '../entities/trip-notification.entity';

export type CreateTripNotificationWithViolationsInput = {
  userId: string;
  tripId: string;
  message: string;
  status: string;
  violationIds: string[];
};

export interface ITripNotificationRepository {
  createWithViolations(
    input: CreateTripNotificationWithViolationsInput,
  ): Promise<{ id: number }>;

  updateStatus(id: number, status: string): Promise<void>;

  deleteById(id: number): Promise<void>;

  findAllByTripId(tripId: string): Promise<TripNotificationEntity[]>;
}

export const ITripNotificationRepositoryToken = Symbol(
  'ITripNotificationRepository',
);
