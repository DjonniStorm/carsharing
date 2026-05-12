/// GeoJSON MultiPolygon coordinates: [polygon][ring][position]
/// Position is [lon, lat].
typedef MultiPolygonCoords = List<List<List<List<double>>>>;

/// Parses `geometry` field from API (Map) into coordinates or null.
MultiPolygonCoords? parseMultiPolygonCoordinates(Object? geometry) {
  if (geometry is! Map) return null;
  final type = geometry['type'];
  if (type != 'MultiPolygon') return null;
  final raw = geometry['coordinates'];
  if (raw is! List) return null;
  try {
    final out = <List<List<List<double>>>>[];
    for (final poly in raw) {
      if (poly is! List) return null;
      final rings = <List<List<double>>>[];
      for (final ring in poly) {
        if (ring is! List) return null;
        final pts = <List<double>>[];
        for (final p in ring) {
          if (p is! List || p.length < 2) return null;
          final lon = (p[0] as num).toDouble();
          final lat = (p[1] as num).toDouble();
          pts.add([lon, lat]);
        }
        rings.add(pts);
      }
      out.add(rings);
    }
    return out;
  } catch (_) {
    return null;
  }
}
