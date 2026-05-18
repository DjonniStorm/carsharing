import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/map/domain/car_position.dart';
import 'package:mobile/features/map/cubit/map_cubit.dart';
import 'package:mobile/shared/realtime/parse_trip_route_point.dart';

void main() {
  group('parseTripRoutePoint', () {
    test('parses speed and fuelLevel from nested payload', () {
      final u = parseTripRoutePoint({
        'event': 'trip.route.point',
        'payload': {
          'tripId': 't1',
          'carId': 'c1',
          'lat': 55.75,
          'lng': 37.62,
          'speed': 48.5,
          'fuelLevel': 62,
          'recordedAt': '2026-01-01T12:00:00.000Z',
        },
      });
      expect(u, isNotNull);
      expect(u!.carId, 'c1');
      expect(u.lat, 55.75);
      expect(u.lon, 37.62);
      expect(u.speedKmh, 48.5);
      expect(u.fuelLevel, 62);
    });

    test('parses lon alias', () {
      final u = parseTripRoutePoint({
        'carId': 'c2',
        'lat': 1,
        'lon': 2,
      });
      expect(u!.lon, 2);
    });

    test('returns null when carId missing', () {
      expect(parseTripRoutePoint({'lat': 1, 'lng': 2}), isNull);
    });
  });

  group('applyTripRoutePointUpdate', () {
    test('merges speed and fuel without clearing existing fields', () {
      const car = CarPosition(
        id: 'c1',
        isAvailable: true,
        lat: 10,
        lon: 20,
        fuelLevel: 80,
      );
      final next = applyTripRoutePointUpdate(
        car,
        const TripRoutePointUpdate(
          carId: 'c1',
          speedKmh: 55,
          fuelLevel: 58,
        ),
      );
      expect(next.lat, 10);
      expect(next.lon, 20);
      expect(next.speedKmh, 55);
      expect(next.fuelLevel, 58);
    });
  });

  group('MapCubit.mergeRestWithLive', () {
    test('preserves live fuel and speed on REST refresh', () {
      const fresh = CarPosition(
        id: 'c1',
        isAvailable: true,
        lat: 1,
        lon: 2,
        fuelLevel: 90,
      );
      const prev = CarPosition(
        id: 'c1',
        isAvailable: true,
        lat: 55.1,
        lon: 37.2,
        fuelLevel: 42,
        speedKmh: 60,
      );
      final merged = MapCubit.mergeRestWithLive(fresh, prev);
      expect(merged.lat, 55.1);
      expect(merged.lon, 37.2);
      expect(merged.fuelLevel, 42);
      expect(merged.speedKmh, 60);
    });
  });
}
