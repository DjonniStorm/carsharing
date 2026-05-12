import '../../shared/config/map_defaults.dart';
import '../../shared/geo/geo_json_multi_polygon.dart';

/// Порт [`trip-route-map-viewport.ts`](apps/web/src/pages/trip/lib/trip-route-map-viewport.ts).
({double centerLat, double centerLon, double zoom}) tripRouteMapViewport({
  required List<({double lon, double lat})> route,
  MultiPolygonCoords? zoneGeometry,
}) {
  var minLon = double.infinity;
  var minLat = double.infinity;
  var maxLon = double.negativeInfinity;
  var maxLat = double.negativeInfinity;
  var any = false;

  void use(double lon, double lat) {
    if (!lon.isFinite || !lat.isFinite) return;
    any = true;
    minLon = minLon < lon ? minLon : lon;
    minLat = minLat < lat ? minLat : lat;
    maxLon = maxLon > lon ? maxLon : lon;
    maxLat = maxLat > lat ? maxLat : lat;
  }

  for (final p in route) {
    use(p.lon, p.lat);
  }

  final zg = zoneGeometry;
  if (zg != null) {
    for (final polygon in zg) {
      for (final ring in polygon) {
        for (final pt in ring) {
          if (pt.length >= 2) {
            use(pt[0], pt[1]);
          }
        }
      }
    }
  }

  if (!any) {
    return (
      centerLat: MapDefaults.centerLatitude,
      centerLon: MapDefaults.centerLongitude,
      zoom: MapDefaults.zoom.toDouble(),
    );
  }

  final centerLat = (minLat + maxLat) / 2;
  final centerLon = (minLon + maxLon) / 2;
  final span = (maxLon - minLon) > (maxLat - minLat)
      ? (maxLon - minLon)
      : (maxLat - minLat);

  var zoom = MapDefaults.zoom.toDouble();
  if (span > 1) {
    zoom = 9;
  } else if (span > 0.5) {
    zoom = 10;
  } else if (span > 0.2) {
    zoom = 11;
  } else if (span > 0.08) {
    zoom = 12;
  } else if (span > 0.03) {
    zoom = 13;
  } else if (span > 0.015) {
    zoom = 14;
  } else if (span > 0.008) {
    zoom = 15;
  } else {
    zoom = 16;
  }

  return (centerLat: centerLat, centerLon: centerLon, zoom: zoom);
}
