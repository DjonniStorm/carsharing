import { TripWsEvent } from '../entities/realtime/trip-event';

/**
 * MVP-набор realtime событий (v1) для карты.
 *
 * Водитель:
 * - изменения статуса поездки
 * - точки маршрута
 * - завершение поездки
 *
 * Менеджер:
 * - обновления позиций машин
 * - изменения состояния машин
 * - агрегаты автопарка (опционально, с throttling)
 */
export const DRIVER_MVP_EVENTS = [
  TripWsEvent.TripStateChanged,
  TripWsEvent.TripMetricsUpdated,
  TripWsEvent.TripRoutePoint,
  TripWsEvent.TripFinished,
] as const;

export const MANAGER_MVP_EVENTS = [
  TripWsEvent.CarLocationUpdated,
  TripWsEvent.CarStateChanged,
  TripWsEvent.FleetSummaryUpdated,
  TripWsEvent.ViolationCreated,
  TripWsEvent.ViolationUpdated,
] as const;
