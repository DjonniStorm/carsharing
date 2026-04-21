import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import {
  TripEventChannelScope,
  TripWsCommand,
} from '../common/trip-realtime.contract';
import type {
  TripWsEnvelope,
  TripWsEventPayloadMap,
} from '../realtime/trip-events.payloads';
import { ITripGateway } from './trip.gateway.interface';

type TripSubscribePayload = { tripId: number };
type CarSubscribePayload = { carId: string };

@WebSocketGateway({
  namespace: '/trip',
  cors: { origin: '*' },
})
export class TripGateway implements ITripGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TripGateway.name);

  @SubscribeMessage(TripWsCommand.SubscribeTrip)
  async subscribeTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TripSubscribePayload,
  ): Promise<void> {
    const room = this.tripRoom(payload.tripId);
    await client.join(room);
    this.logger.debug(`client=${client.id} joined ${room}`);
  }

  @SubscribeMessage(TripWsCommand.UnsubscribeTrip)
  async unsubscribeTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TripSubscribePayload,
  ): Promise<void> {
    const room = this.tripRoom(payload.tripId);
    await client.leave(room);
    this.logger.debug(`client=${client.id} left ${room}`);
  }

  @SubscribeMessage(TripWsCommand.SubscribeCar)
  async subscribeCar(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CarSubscribePayload,
  ): Promise<void> {
    const room = this.carRoom(payload.carId);
    await client.join(room);
    this.logger.debug(`client=${client.id} joined ${room}`);
  }

  @SubscribeMessage(TripWsCommand.UnsubscribeCar)
  async unsubscribeCar(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CarSubscribePayload,
  ): Promise<void> {
    const room = this.carRoom(payload.carId);
    await client.leave(room);
    this.logger.debug(`client=${client.id} left ${room}`);
  }

  @SubscribeMessage(TripWsCommand.SubscribeFleet)
  async subscribeFleet(@ConnectedSocket() client: Socket): Promise<void> {
    await client.join(this.fleetRoom());
    this.logger.debug(`client=${client.id} joined ${this.fleetRoom()}`);
  }

  @SubscribeMessage(TripWsCommand.UnsubscribeFleet)
  async unsubscribeFleet(@ConnectedSocket() client: Socket): Promise<void> {
    await client.leave(this.fleetRoom());
    this.logger.debug(`client=${client.id} left ${this.fleetRoom()}`);
  }

  publish<E extends keyof TripWsEventPayloadMap>(
    event: TripWsEnvelope<E, TripWsEventPayloadMap[E]>,
  ): void {
    const room = this.resolveRoom(event);
    if (!room) {
      this.logger.debug(`skip internal event=${event.event} id=${event.eventId}`);
      return;
    }
    this.server.to(room).emit(event.event, event);
    this.logger.debug(`emit event=${event.event} room=${room} id=${event.eventId}`);
  }

  private resolveRoom<E extends keyof TripWsEventPayloadMap>(
    event: TripWsEnvelope<E, TripWsEventPayloadMap[E]>,
  ): string | null {
    if (event.channelScope === TripEventChannelScope.ManagerFleet) {
      return this.fleetRoom();
    }
    if (event.channelScope === TripEventChannelScope.ManagerCar) {
      const carId = (event.payload as { carId?: string }).carId;
      return carId ? this.carRoom(carId) : null;
    }
    if (
      event.channelScope === TripEventChannelScope.DriverTrip ||
      event.channelScope === TripEventChannelScope.ManagerTrip
    ) {
      const tripId = (event.payload as { tripId?: number }).tripId;
      return typeof tripId === 'number' ? this.tripRoom(tripId) : null;
    }
    return null;
  }

  private tripRoom(tripId: number): string {
    return `trip:${tripId}`;
  }

  private carRoom(carId: string): string {
    return `car:${carId}`;
  }

  private fleetRoom(): string {
    return 'fleet';
  }
}

