import 'geo_json_multi_polygon.dart';

bool pointInRing(double lon, double lat, List<List<double>> ring) {
  if (ring.length < 3) return false;
  var inside = false;
  for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    final xi = ring[i][0];
    final yi = ring[i][1];
    final xj = ring[j][0];
    final yj = ring[j][1];
    final intersect = (yi > lat) != (yj > lat) &&
        lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-18) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

/// One GeoJSON polygon: first ring exterior, rest holes.
bool pointInPolygonWithHoles(
  double lon,
  double lat,
  List<List<List<double>>> polygon,
) {
  if (polygon.isEmpty) return false;
  final exterior = polygon.first;
  if (!pointInRing(lon, lat, exterior)) return false;
  for (var h = 1; h < polygon.length; h++) {
    if (pointInRing(lon, lat, polygon[h])) return false;
  }
  return true;
}

bool pointInMultiPolygonCoords(
  double lon,
  double lat,
  MultiPolygonCoords coords,
) {
  for (final polygon in coords) {
    if (pointInPolygonWithHoles(lon, lat, polygon)) return true;
  }
  return false;
}
