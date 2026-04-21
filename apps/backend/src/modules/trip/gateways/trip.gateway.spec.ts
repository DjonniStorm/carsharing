import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TripEventChannelScope } from '../common/trip-realtime.contract';
import { TripWsEvent } from '../entities/realtime/trip-event';
import { createTripWsEvent } from '../realtime/trip-events.emitter';
import { TripStatus } from '../entities/trip.status';
import { TripGateway } from './trip.gateway';

describe('TripGateway', () => {
  let moduleRef: TestingModule;
  let gateway: TripGateway;

  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));
  const join = vi.fn(async () => undefined);
  const leave = vi.fn(async () => undefined);

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [TripGateway],
    }).compile();
    gateway = moduleRef.get(TripGateway);

    gateway.server = { to } as unknown as TripGateway['server'];
  });

  afterEach(async () => {
    emit.mockReset();
    to.mockClear();
    join.mockClear();
    leave.mockClear();
    await moduleRef.close();
  });

  describe('Транспортный слой (routing rooms/emits)', () => {
    it('подписывает клиента на комнату поездки', async () => {
      const client = { id: 'client-1', join, leave } as unknown as Parameters<
        TripGateway['subscribeTrip']
      >[0];

      await gateway.subscribeTrip(client, { tripId: 42 });

      expect(join).toHaveBeenCalledWith('trip:42');
    });

    it('отписывает клиента от комнаты поездки', async () => {
      const client = { id: 'client-1', join, leave } as unknown as Parameters<
        TripGateway['unsubscribeTrip']
      >[0];

      await gateway.unsubscribeTrip(client, { tripId: 42 });

      expect(leave).toHaveBeenCalledWith('trip:42');
    });

    it('подписывает и отписывает клиента по комнате машины', async () => {
      const client = { id: 'client-2', join, leave } as unknown as Parameters<
        TripGateway['subscribeCar']
      >[0];

      await gateway.subscribeCar(client, { carId: 'car-7' });
      await gateway.unsubscribeCar(client, { carId: 'car-7' });

      expect(join).toHaveBeenCalledWith('car:car-7');
      expect(leave).toHaveBeenCalledWith('car:car-7');
    });

    it('подписывает и отписывает клиента на fleet-комнату', async () => {
      const client = { id: 'client-3', join, leave } as unknown as Parameters<
        TripGateway['subscribeFleet']
      >[0];

      await gateway.subscribeFleet(client);
      await gateway.unsubscribeFleet(client);

      expect(join).toHaveBeenCalledWith('fleet');
      expect(leave).toHaveBeenCalledWith('fleet');
    });

    it('публикует событие поездки в room trip:{tripId}', () => {
      const event = createTripWsEvent(
        TripWsEvent.TripStateChanged,
        {
          tripId: 17,
          carId: 'car-1',
          status: TripStatus.ACTIVE,
          ts: '2026-04-21T10:00:00.000Z',
        },
        {
          eventId: 'event-trip',
          ts: '2026-04-21T10:00:00.000Z',
        },
      );

      gateway.publish(event);

      expect(to).toHaveBeenCalledWith('trip:17');
      expect(emit).toHaveBeenCalledWith(TripWsEvent.TripStateChanged, event);
    });

    it('публикует событие машины в room car:{carId}', () => {
      const event = createTripWsEvent(
        TripWsEvent.CarLocationUpdated,
        {
          carId: 'car-22',
          lat: 55.75,
          lng: 37.61,
          positionAt: '2026-04-21T10:01:00.000Z',
        },
        {
          eventId: 'event-car',
          ts: '2026-04-21T10:01:00.000Z',
        },
      );

      gateway.publish(event);

      expect(to).toHaveBeenCalledWith('car:car-22');
      expect(emit).toHaveBeenCalledWith(TripWsEvent.CarLocationUpdated, event);
    });

    it('публикует fleet-событие в room fleet', () => {
      const event = createTripWsEvent(
        TripWsEvent.FleetSummaryUpdated,
        {
          totalCars: 10,
          availableCars: 8,
          inUseCars: 2,
          maintenanceCars: 0,
          activeTrips: 2,
          ts: '2026-04-21T10:02:00.000Z',
        },
        {
          eventId: 'event-fleet',
          ts: '2026-04-21T10:02:00.000Z',
        },
      );

      gateway.publish(event);

      expect(to).toHaveBeenCalledWith('fleet');
      expect(emit).toHaveBeenCalledWith(TripWsEvent.FleetSummaryUpdated, event);
    });

    it('не эмитит событие internal scope', () => {
      const event = createTripWsEvent(
        TripWsEvent.TelemetryReceived,
        {
          carId: 'car-30',
          tripId: 3,
          receivedAt: '2026-04-21T10:03:00.000Z',
        },
        {
          eventId: 'event-internal',
          ts: '2026-04-21T10:03:00.000Z',
        },
      );

      gateway.publish(event);

      expect(to).not.toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
    });

    it('не эмитит manager:car при отсутствии carId в payload', () => {
      const event = {
        eventId: 'event-bad-car',
        event: TripWsEvent.CarStateChanged,
        ts: '2026-04-21T10:04:00.000Z',
        audience: 1,
        channelScope: TripEventChannelScope.ManagerCar,
        payload: { status: 1, isAvailable: true, ts: '2026-04-21T10:04:00.000Z' },
      } as unknown as Parameters<TripGateway['publish']>[0];

      gateway.publish(event);

      expect(to).not.toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('Бизнес-правила подписки и доступа', () => {
    it.todo('reject subscribe.trip с невалидным tripId');
    it.todo('reject subscribe.car с невалидным UUID carId');
    it.todo('reject subscribe.trip если trip не существует');
    it.todo('reject subscribe.car если car не существует');
    it.todo('reject manager scopes для роли driver');
    it.todo('emit subscription.error с кодом причины');
  });
});

