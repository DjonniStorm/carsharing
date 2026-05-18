import '../../../shared/geo/geo_json_multi_polygon.dart';
import '../domain/geozone_kind.dart';
import '../domain/rental_zone.dart';
import 'geozones_api.dart';

double? _parsePrice(Object? raw) {
  if (raw == null) return null;
  if (raw is num) return raw.toDouble();
  if (raw is String) return double.tryParse(raw.trim());
  return null;
}

Map<String, double?> _tariffFromVersionMap(Map<String, dynamic> vm) {
  return {
    'pricePerMinute': _parsePrice(vm['pricePerMinute']),
    'pricePerKm': _parsePrice(vm['pricePerKm']),
    'pausePricePerMinute': _parsePrice(vm['pausePricePerMinute']),
  };
}

class GeozonesRepository {
  GeozonesRepository(this._api);

  final GeozonesApi _api;

  Future<List<RentalZone>> listZonesInBoundingBox({
    required double minLon,
    required double minLat,
    required double maxLon,
    required double maxLat,
  }) async {
    final raw = await _api.boundingBox(
      minLon: minLon,
      minLat: minLat,
      maxLon: maxLon,
      maxLat: maxLat,
    );
    final out = <RentalZone>[];
    for (final item in raw) {
      if (item is! Map) continue;
      final m = item.map((k, v) => MapEntry(k.toString(), v));
      final kind = GeozoneKind.parse(m['type']);
      if (kind == GeozoneKind.other) continue;
      final version = m['currentVersion'];
      if (version is! Map) continue;
      final vm = version.map((k, v) => MapEntry(k.toString(), v));
      final vid = vm['id']?.toString();
      final geom = parseMultiPolygonCoordinates(vm['geometry']);
      if (vid == null || vid.isEmpty || geom == null) continue;
      final id = m['id']?.toString() ?? '';
      if (id.isEmpty) continue;
      final tariff = _tariffFromVersionMap(vm);
      out.add(
        RentalZone(
          id: id,
          name: m['name']?.toString() ?? '',
          colorHex: m['color']?.toString() ?? '#6366F1',
          geoZoneVersionId: vid,
          geometry: geom,
          kind: kind,
          pricePerMinute: tariff['pricePerMinute'],
          pricePerKm: tariff['pricePerKm'],
          pausePricePerMinute: tariff['pausePricePerMinute'],
        ),
      );
    }
    return out;
  }

  /// Геометрия версии геозоны или `null`, если полигон не распарсился.
  Future<MultiPolygonCoords?> geometryForVersionId(String versionId) async {
    if (versionId.isEmpty) return null;
    try {
      final raw = await _api.getVersionById(versionId);
      return parseMultiPolygonCoordinates(raw['geometry']);
    } catch (_) {
      return null;
    }
  }

  /// Зона аренды по зафиксированной версии поездки (`geoZoneVersionId`).
  Future<RentalZone?> rentalZoneForTripVersion(
    String versionId, {
    RentalZone? styleFrom,
  }) async {
    if (versionId.isEmpty) return null;
    try {
      final raw = await _api.getVersionById(versionId);
      final geozoneId = raw['geozoneId']?.toString() ?? '';
      final geom = parseMultiPolygonCoordinates(raw['geometry']);
      if (geozoneId.isEmpty || geom == null) return null;
      final vm = raw.map((k, v) => MapEntry(k.toString(), v));
      final tariff = _tariffFromVersionMap(vm);
      return RentalZone(
        id: geozoneId,
        name: styleFrom?.name ?? '',
        colorHex: styleFrom?.colorHex ?? '#2563EB',
        geoZoneVersionId: versionId,
        geometry: geom,
        kind: GeozoneKind.rental,
        pricePerMinute: tariff['pricePerMinute'] ?? styleFrom?.pricePerMinute,
        pricePerKm: tariff['pricePerKm'] ?? styleFrom?.pricePerKm,
        pausePricePerMinute:
            tariff['pausePricePerMinute'] ?? styleFrom?.pausePricePerMinute,
      );
    } catch (_) {
      return null;
    }
  }
}
