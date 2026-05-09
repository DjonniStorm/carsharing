import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { PrismaService } from 'src/prisma/prisma.service';
import type { JwtPayload } from 'src/modules/auth/types/jwt-payload';
import type { AuthenticatedUser } from 'src/modules/auth/types/authenticated-user';
import { UserRole } from 'src/modules/user/entities/user.role';

import {
  TripEventChannelScope,
  TripWsCommand,
} from '../common/trip-realtime.contract';
import type {
  TripWsEnvelope,
  TripWsEventPayloadMap,
} from '../realtime/trip-events.payloads';
import { ITripGateway } from './trip.gateway.interface';

type TripSubscribePayload = { tripId: string };
type CarSubscribePayload = { carId: string };

@WebSocketGateway({
  namespace: '/trip',
  cors: { origin: '*' },
})
export class TripGateway implements ITripGateway, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TripGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: Socket): void {
    const raw =
      client.handshake.auth?.['token'] ?? client.handshake.query?.['token'];
    const token =
      typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      client.data.user = {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
      } satisfies AuthenticatedUser;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage(TripWsCommand.SubscribeTrip)
  async subscribeTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TripSubscribePayload,
  ): Promise<void> {
    const user = client.data.user as AuthenticatedUser | undefined;
    if (!user) {
      return;
    }
    if (user.role === UserRole.DRIVER) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: payload.tripId },
        select: { userId: true },
      });
      if (!trip || trip.userId !== user.id) {
        this.logger.debug(
          `subscribeTrip denied client=${client.id} tripId=${payload.tripId}`,
        );
        return;
      }
    }
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
      this.logger.debug(
        `skip internal event=${event.event} id=${event.eventId}`,
      );
      return;
    }
    this.server.to(room).emit(event.event, event);
    this.logger.debug(
      `emit event=${event.event} room=${room} id=${event.eventId}`,
    );
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
      const tripId = (event.payload as { tripId?: string }).tripId;
      return tripId ? this.tripRoom(tripId) : null;
    }
    return null;
  }

  private tripRoom(tripId: string): string {
    return `trip:${tripId}`;
  }

  private carRoom(carId: string): string {
    return `car:${carId}`;
  }

  private fleetRoom(): string {
    return 'fleet';
  }
}
