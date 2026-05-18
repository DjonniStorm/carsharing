import { describe, expect, it, vi } from 'vitest';

import { TripStatus } from '../entities/trip.status';
import { TripWsEvent } from '../entities/realtime/trip-event';
import type { TripRead } from '../entities/dtos/trip.read';
import type { ITripRealtimeOutbox } from '../realtime/trip-realtime.outbox.interface';
import { TripRealtimePublisher } from './trip-realtime.publisher';

function sampleTrip(overrides: Partial<TripRead> = {}): TripRead {
  return {
    id: 'trip-1',
    userId: 'user-1',
    carId: 'car-1',
    geoZoneVersionId: 'gzv-1',
    status: TripStatus.ACTIVE,
    startedAt: new Date('2026-05-18T10:00:00.000Z'),
    finishedAt: null,
    pauseStartedAt: null,
    totalPausedSec: 0,
    startLat: 55.75,
    startLng: 37.61,
    finishLat: null,
    finishLng: null,
    distance: 1,
    duration: 0.5,
    distanceMeters: 1000,
    chargedMinutes: 10,
    chargedKm: 1,
    priceTime: 20,
    priceDistance: 10,
    pricePause: 0,
    priceTotal: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
    carPlateSnapshot: null,
    carDisplayNameSnapshot: null,
    ...overrides,
  };
}

describe('TripRealtimePublisher', () => {
  it('publishes trip.state.changed with previousStatus', async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    const outbox = { publish } as unknown as ITripRealtimeOutbox;
    const publisher = new TripRealtimePublisher(outbox);
    const trip = sampleTrip();

    await publisher.publishTripStateChanged(trip, TripStatus.STARTED);

    expect(publish).toHaveBeenCalledOnce();
    const envelope = publish.mock.calls[0]![0];
    expect(envelope.event).toBe(TripWsEvent.TripStateChanged);
    expect(envelope.payload).toMatchObject({
      tripId: 'trip-1',
      carId: 'car-1',
      status: TripStatus.ACTIVE,
      previousStatus: TripStatus.STARTED,
    });
  });

  it('publishes trip.metrics.updated with billing fields', async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    const outbox = { publish } as unknown as ITripRealtimeOutbox;
    const publisher = new TripRealtimePublisher(outbox);
    const trip = sampleTrip();

    await publisher.publishTripMetricsUpdated(trip);

    const envelope = publish.mock.calls[0]![0];
    expect(envelope.event).toBe(TripWsEvent.TripMetricsUpdated);
    expect(envelope.payload).toMatchObject({
      tripId: 'trip-1',
      priceTotal: 30,
      distanceMeters: 1000,
    });
  });

  it('publishes trip.finished', async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    const outbox = { publish } as unknown as ITripRealtimeOutbox;
    const publisher = new TripRealtimePublisher(outbox);
    const finishedAt = new Date('2026-05-18T11:00:00.000Z');
    const trip = sampleTrip({
      status: TripStatus.FINISHED,
      finishedAt,
    });

    await publisher.publishTripFinished(trip);

    const envelope = publish.mock.calls[0]![0];
    expect(envelope.event).toBe(TripWsEvent.TripFinished);
    expect(envelope.payload).toMatchObject({
      tripId: 'trip-1',
      finishedAt: finishedAt.toISOString(),
      priceTotal: 30,
    });
  });
});
