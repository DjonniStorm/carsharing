import '../../features/trip/domain/live_trip_metrics.dart';
import '../../features/trip/domain/trip_status.dart';

Map<String, dynamic>? _readPayload(Map<String, dynamic> raw) {
  final nested = raw['payload'];
  if (nested is Map) {
    return nested.map((k, v) => MapEntry(k.toString(), v));
  }
  return raw;
}

String? _readString(Object? v) {
  if (v == null) return null;
  final s = v.toString().trim();
  return s.isEmpty ? null : s;
}

double? _readNullableNumber(Object? v) {
  if (v == null) return null;
  if (v is num && v.isFinite) return v.toDouble();
  final n = double.tryParse(v.toString());
  return n != null && n.isFinite ? n : null;
}

int? _readTripStatus(Object? v) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  final n = int.tryParse(v?.toString() ?? '');
  return n;
}

bool _isValidStatus(int? status) {
  if (status == null) return false;
  return status >= TripStatusCode.pending && status <= TripStatusCode.unknown;
}

DateTime? _readDateTime(Object? v) {
  if (v == null) return null;
  if (v is DateTime) return v;
  return DateTime.tryParse(v.toString());
}

/// Парсит envelope или payload `trip.metrics.updated`.
LiveTripMetrics? parseTripMetricsUpdated(Map<String, dynamic> raw) {
  final p = _readPayload(raw);
  if (p == null) return null;

  final tripId = _readString(p['tripId']);
  final ts = _readString(p['ts']);
  if (tripId == null || ts == null) return null;

  return LiveTripMetrics(
    distanceMeters: _readNullableNumber(p['distanceMeters']),
    chargedMinutes: _readNullableNumber(p['chargedMinutes']),
    chargedKm: _readNullableNumber(p['chargedKm']),
    priceTime: _readNullableNumber(p['priceTime']),
    priceDistance: _readNullableNumber(p['priceDistance']),
    pricePause: _readNullableNumber(p['pricePause']),
    priceTotal: _readNullableNumber(p['priceTotal']),
    updatedAt: _readDateTime(ts),
  );
}

class TripStateChangedWs {
  const TripStateChangedWs({
    required this.tripId,
    required this.carId,
    required this.status,
    this.previousStatus,
    required this.ts,
  });

  final String tripId;
  final String carId;
  final int status;
  final int? previousStatus;
  final DateTime ts;
}

TripStateChangedWs? parseTripStateChanged(Map<String, dynamic> raw) {
  final p = _readPayload(raw);
  if (p == null) return null;

  final tripId = _readString(p['tripId']);
  final carId = _readString(p['carId']);
  final ts = _readString(p['ts']);
  final status = _readTripStatus(p['status']);
  if (tripId == null || carId == null || ts == null || !_isValidStatus(status)) {
    return null;
  }

  final prev = _readTripStatus(p['previousStatus']);
  return TripStateChangedWs(
    tripId: tripId,
    carId: carId,
    status: status!,
    previousStatus: _isValidStatus(prev) ? prev : null,
    ts: DateTime.tryParse(ts) ?? DateTime.now().toUtc(),
  );
}

class TripFinishedWs {
  const TripFinishedWs({
    required this.tripId,
    required this.carId,
    required this.finishedAt,
    this.distanceMeters,
    this.chargedMinutes,
    this.chargedKm,
    this.priceTotal,
    required this.ts,
  });

  final String tripId;
  final String carId;
  final DateTime finishedAt;
  final double? distanceMeters;
  final double? chargedMinutes;
  final double? chargedKm;
  final double? priceTotal;
  final DateTime ts;
}

TripFinishedWs? parseTripFinished(Map<String, dynamic> raw) {
  final p = _readPayload(raw);
  if (p == null) return null;

  final tripId = _readString(p['tripId']);
  final carId = _readString(p['carId']);
  final finishedAt = _readString(p['finishedAt']);
  final ts = _readString(p['ts']);
  if (tripId == null || carId == null || finishedAt == null || ts == null) {
    return null;
  }

  return TripFinishedWs(
    tripId: tripId,
    carId: carId,
    finishedAt: DateTime.tryParse(finishedAt) ?? DateTime.now().toUtc(),
    distanceMeters: _readNullableNumber(p['distanceMeters']),
    chargedMinutes: _readNullableNumber(p['chargedMinutes']),
    chargedKm: _readNullableNumber(p['chargedKm']),
    priceTotal: _readNullableNumber(p['priceTotal']),
    ts: DateTime.tryParse(ts) ?? DateTime.now().toUtc(),
  );
}

String? readTripIdFromEnvelope(Map<String, dynamic> e) {
  final direct = e['tripId'] ?? e['trip_id'];
  if (direct != null) return direct.toString();

  final p = e['payload'];
  if (p is Map) {
    final id = p['tripId'] ?? p['id'];
    if (id != null) return id.toString();
  }

  final trip = e['trip'];
  if (trip is Map && trip['id'] != null) {
    return trip['id'].toString();
  }
  return null;
}
