import 'package:flutter/material.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';

import '../../../shared/geo/geo_json_multi_polygon.dart';
import '../../../shared/geo/point_in_polygon.dart';
import 'geozone_kind.dart';

class RentalZone {
  const RentalZone({
    required this.id,
    required this.name,
    required this.colorHex,
    required this.geoZoneVersionId,
    required this.geometry,
    required this.kind,
    this.pricePerMinute,
    this.pricePerKm,
    this.pausePricePerMinute,
  });

  final String id;
  final String name;
  final String colorHex;
  final String geoZoneVersionId;
  final MultiPolygonCoords geometry;
  final GeozoneKind kind;
  final double? pricePerMinute;
  final double? pricePerKm;
  final double? pausePricePerMinute;

  bool get hasTariff =>
      pricePerMinute != null || pricePerKm != null || pausePricePerMinute != null;

  bool containsLonLat(double lon, double lat) =>
      pointInMultiPolygonCoords(lon, lat, geometry);

  List<PolygonMapObject> buildPolygons({
    required bool selected,
    required void Function(RentalZone zone)? onTripZoneTap,
    bool isTripContract = false,
  }) {
    final stroke = parseZoneColor(colorHex);
    final muted = kind == GeozoneKind.parking;
    final strokeUse =
        muted ? Color.lerp(stroke, Colors.grey, 0.35)! : stroke;
    final fill = strokeUse.withAlpha(
      isTripContract ? 90 : (muted ? 45 : 70),
    );
    final sw = isTripContract ? 3.5 : (selected ? 3.0 : 1.5);
    final baseZ = kind == GeozoneKind.rental ? 2.0 : 0.5;
    final z = selected ? baseZ + 1.0 : baseZ;
    final tripTap = onTripZoneTap;
    final interactive =
        tripTap != null && kind == GeozoneKind.rental;

    final objects = <PolygonMapObject>[];
    for (var pi = 0; pi < geometry.length; pi++) {
      final polygonRings = geometry[pi];
      if (polygonRings.isEmpty) continue;
      final exterior = polygonRings.first;
      final holes = polygonRings.sublist(1);
      objects.add(
        PolygonMapObject(
          mapId: MapObjectId('zone-${kind.name}-$id-$pi'),
          polygon: Polygon(
            outerRing: LinearRing(
              points: [
                for (final p in exterior)
                  Point(latitude: p[1], longitude: p[0]),
              ],
            ),
            innerRings: [
              for (final h in holes)
                LinearRing(
                  points: [
                    for (final p in h) Point(latitude: p[1], longitude: p[0]),
                  ],
                ),
            ],
          ),
          strokeColor: strokeUse,
          strokeWidth: sw,
          fillColor: fill,
          zIndex: z,
          isGeodesic: true,
          consumeTapEvents: interactive,
          onTap: interactive ? (_, __) => tripTap(this) : null,
        ),
      );
    }
    return objects;
  }
}

Color parseZoneColor(String raw) {
  final s = raw.trim();
  if (!s.startsWith('#')) return const Color(0xFF6366F1);
  final hex = s.substring(1);
  final v = int.tryParse(hex, radix: 16);
  if (v == null) return const Color(0xFF6366F1);
  switch (hex.length) {
    case 6:
      return Color(0xFF000000 | v);
    case 8:
      return Color(v);
    default:
      return const Color(0xFF6366F1);
  }
}
