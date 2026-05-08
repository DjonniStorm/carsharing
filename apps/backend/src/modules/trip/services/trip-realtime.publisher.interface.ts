import type { TripRead } from '../entities/dtos/trip.read';

/**
 * Output port для realtime-публикации trip-событий.
 * CRUD-сервис зависит от этого интерфейса, а не от конкретного WS транспорта.
 */
export interface ITripRealtimePublisher {
  publishTripStarted(trip: TripRead): Promise<void>;
}

export const ITripRealtimePublisherToken = Symbol('ITripRealtimePublisher');

