import '../../features/map/domain/car_position.dart';

/// Частичное обновление машины из WS `trip.route.point` / `car.location.updated`.
class TripRoutePointUpdate {
  const TripRoutePointUpdate({
    required this.carId,
    this.lat,
    this.lon,
    this.speedKmh,
    this.fuelLevel,
  });

  final String carId;
  final double? lat;
  final double? lon;
  final double? speedKmh;
  final double? fuelLevel;
}

Map<String, dynamic>? _readPayload(Map<String, dynamic> raw) {
  final nested = raw['payload'];
  if (nested is Map) {
    return nested.map((k, v) => MapEntry(k.toString(), v));
  }
  return raw;
}

double? _readNullableNumber(Object? v) {
  if (v == null) return null;
  if (v is num && v.isFinite) return v.toDouble();
  final n = double.tryParse(v.toString());
  return n != null && n.isFinite ? n : null;
}

/// Парсит envelope или payload события позиции / точки маршрута.
TripRoutePointUpdate? parseTripRoutePoint(Map<String, dynamic> raw) {
  final data = _readPayload(raw);
  if (data == null) return null;

  final carId = data['carId']?.toString().trim() ?? '';
  if (carId.isEmpty) return null;

  final lat = _readNullableNumber(data['lat']);
  final lon =
      _readNullableNumber(data['lng']) ?? _readNullableNumber(data['lon']);
  final speedKmh = _readNullableNumber(data['speed']);
  final fuelLevel = _readNullableNumber(data['fuelLevel']);

  if (lat == null && lon == null && speedKmh == null && fuelLevel == null) {
    return null;
  }

  return TripRoutePointUpdate(
    carId: carId,
    lat: lat,
    lon: lon,
    speedKmh: speedKmh,
    fuelLevel: fuelLevel,
  );
}

/// Применяет частичное обновление; `null` в [update] не затирает поля [car].
CarPosition applyTripRoutePointUpdate(
  CarPosition car,
  TripRoutePointUpdate update,
) {
  return car.copyWith(
    lat: update.lat ?? car.lat,
    lon: update.lon ?? car.lon,
    speedKmh: update.speedKmh ?? car.speedKmh,
    fuelLevel: update.fuelLevel ?? car.fuelLevel,
  );
}
