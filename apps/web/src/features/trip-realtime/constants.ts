/**
 * Совпадают с бэкендом: `TripWsEvent`, `TripWsCommand`
 * (`apps/backend/src/modules/trip/entities/realtime/trip-event.ts`,
 * `trip-realtime.contract.ts`).
 */
export const TripWsEvent = {
  CarLocationUpdated: "car.location.updated",
} as const;

export type TripWsEventName = (typeof TripWsEvent)[keyof typeof TripWsEvent];

export const TripWsCommand = {
  SubscribeCar: "subscribe.car",
  UnsubscribeCar: "unsubscribe.car",
} as const;
