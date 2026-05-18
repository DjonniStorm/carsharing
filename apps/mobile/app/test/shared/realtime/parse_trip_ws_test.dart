import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/trip/domain/live_trip_metrics.dart';
import 'package:mobile/features/trip/domain/trip_read.dart';
import 'package:mobile/features/trip/domain/trip_status.dart';
import 'package:mobile/shared/realtime/parse_trip_ws.dart';

void main() {
  group('parseTripMetricsUpdated', () {
    test('parses nested payload envelope', () {
      final m = parseTripMetricsUpdated({
        'event': 'trip.metrics.updated',
        'payload': {
          'tripId': 't1',
          'carId': 'c1',
          'ts': '2026-01-01T12:00:00.000Z',
          'distanceMeters': 1500,
          'priceTotal': 42.5,
        },
      });
      expect(m, isNotNull);
      expect(m!.distanceMeters, 1500);
      expect(m.priceTotal, 42.5);
    });

    test('returns null when tripId missing', () {
      expect(
        parseTripMetricsUpdated({
          'payload': {'ts': '2026-01-01T12:00:00.000Z'},
        }),
        isNull,
      );
    });
  });

  group('parseTripFinished', () {
    test('parses finish payload', () {
      final f = parseTripFinished({
        'payload': {
          'tripId': 't1',
          'carId': 'c1',
          'finishedAt': '2026-01-01T13:00:00.000Z',
          'ts': '2026-01-01T13:00:00.000Z',
          'priceTotal': 100,
          'distanceMeters': 5000,
        },
      });
      expect(f, isNotNull);
      expect(f!.priceTotal, 100);
      expect(f.distanceMeters, 5000);
    });
  });

  group('LiveTripMetrics.merge', () {
    test('live overrides trip billing fields', () {
      final trip = TripRead(
        id: 't1',
        userId: 'u1',
        carId: 'c1',
        geoZoneVersionId: 'z1',
        status: TripStatusCode.active,
        startedAt: DateTime.utc(2026),
        distance: 1,
        duration: 1,
        priceTotal: 10,
        distanceMeters: 100,
      );
      final live = LiveTripMetrics(priceTotal: 25, distanceMeters: 2000);
      final merged = LiveTripMetrics.merge(live, trip);
      expect(merged.priceTotal, 25);
      expect(merged.distanceMeters, 2000);
      expect(merged.distanceKm, 2);
    });
  });
}
