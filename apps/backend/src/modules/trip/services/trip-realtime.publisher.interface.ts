import type { TripRead } from '../entities/dtos/trip.read';
import type { TripStatus } from '../entities/trip.status';

/**
 * Output port для realtime-публикации trip-событий.
 * CRUD-сервис зависит от этого интерфейса, а не от конкретного WS транспорта.
 */
export interface ITripRealtimePublisher {
  publishTripStarted(trip: TripRead): Promise<void>;
  publishTripStateChanged(
    trip: TripRead,
    previousStatus?: TripStatus,
  ): Promise<void>;
  publishTripMetricsUpdated(trip: TripRead): Promise<void>;
  publishTripFinished(trip: TripRead): Promise<void>;
}

export const ITripRealtimePublisherToken = Symbol('ITripRealtimePublisher');
