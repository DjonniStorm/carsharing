/**
 * Совпадают с бэкендом: `TripWsEvent`, `TripWsCommand`
 * (`apps/backend/src/modules/trip/entities/realtime/trip-event.ts`,
 * `trip-realtime.contract.ts`).
 */
export const TripWsEvent = {
  TripStateChanged: "trip.state.changed",
  TripMetricsUpdated: "trip.metrics.updated",
  TripFinished: "trip.finished",
  CarStateChanged: "car.state.changed",
  CarLocationUpdated: "car.location.updated",
} as const;

export type TripWsEventName = (typeof TripWsEvent)[keyof typeof TripWsEvent];

export const TripWsCommand = {
  SubscribeTrip: "subscribe.trip",
  UnsubscribeTrip: "unsubscribe.trip",
  SubscribeCar: "subscribe.car",
  UnsubscribeCar: "unsubscribe.car",
} as const;

export type TripWsCommandName =
  (typeof TripWsCommand)[keyof typeof TripWsCommand];
