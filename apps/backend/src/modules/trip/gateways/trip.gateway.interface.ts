import type { Socket } from 'socket.io';

import type {
  TripWsEnvelope,
  TripWsEventPayloadMap,
} from '../realtime/trip-events.payloads';

export interface ITripGateway {
  subscribeTrip(
    client: Socket,
    payload: { tripId: number },
  ): Promise<void>;

  unsubscribeTrip(
    client: Socket,
    payload: { tripId: number },
  ): Promise<void>;

  subscribeCar(
    client: Socket,
    payload: { carId: string },
  ): Promise<void>;

  unsubscribeCar(
    client: Socket,
    payload: { carId: string },
  ): Promise<void>;

  subscribeFleet(client: Socket): Promise<void>;

  unsubscribeFleet(client: Socket): Promise<void>;

  publish<E extends keyof TripWsEventPayloadMap>(
    event: TripWsEnvelope<E, TripWsEventPayloadMap[E]>,
  ): void;
}

