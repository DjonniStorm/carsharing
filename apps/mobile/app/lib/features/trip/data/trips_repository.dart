import '../domain/trip_read.dart';
import '../domain/trip_status.dart';
import 'trips_api.dart';

class TripsRepository {
  TripsRepository(this._api);

  final TripsApi _api;

  Future<List<TripRead>> listTrips({int? status}) async {
    final raw = await _api.list(status: status);
    return raw
        .whereType<Map>()
        .map((m) => TripRead.fromJson(Map<String, dynamic>.from(m)))
        .where((t) => t.id.isNotEmpty)
        .toList(growable: false);
  }

  Future<TripRead?> findActiveForDriver() async {
    for (final status in [
      TripStatusCode.active,
      TripStatusCode.started,
      TripStatusCode.paused,
      TripStatusCode.pending,
    ]) {
      final trips = await listTrips(status: status);
      if (trips.isNotEmpty) return trips.first;
    }
    return null;
  }

  Future<TripRead> getById(String id) async {
    final m = await _api.getById(id);
    return TripRead.fromJson(m);
  }

  Future<TripRead> create({
    required String userId,
    required String carId,
    required String geoZoneVersionId,
    int? status,
    double? startLat,
    double? startLng,
    String? carPlateSnapshot,
    String? carDisplayNameSnapshot,
  }) async {
    final body = <String, dynamic>{
      'userId': userId,
      'carId': carId,
      'geoZoneVersionId': geoZoneVersionId,
      if (status != null) 'status': status,
      if (startLat != null) 'startLat': startLat,
      if (startLng != null) 'startLng': startLng,
      if (carPlateSnapshot != null && carPlateSnapshot.isNotEmpty)
        'carPlateSnapshot': carPlateSnapshot,
      if (carDisplayNameSnapshot != null && carDisplayNameSnapshot.isNotEmpty)
        'carDisplayNameSnapshot': carDisplayNameSnapshot,
    };
    final m = await _api.create(body);
    return TripRead.fromJson(m);
  }

  Future<TripRead> patch(String id, Map<String, dynamic> patch) async {
    final m = await _api.patch(id, patch);
    return TripRead.fromJson(m);
  }
}
