import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';

import '../../geozone/domain/geozone_kind.dart';
import '../../geozone/domain/rental_zone.dart';
import '../../../shared/geo/geo_json_multi_polygon.dart';
import '../domain/telemetry_point_read.dart';
import '../trip_route_map_viewport.dart';

/// Карта маршрута поездки из истории (полилиния + старт/финиш + опциональная зона).
class TripHistoryRouteMap extends StatefulWidget {
  const TripHistoryRouteMap({
    super.key,
    required this.points,
    this.zoneGeometry,
    this.height = 280,
    this.startLat,
    this.startLng,
    this.finishLat,
    this.finishLng,
  });

  final List<TelemetryPointRead> points;
  final MultiPolygonCoords? zoneGeometry;
  final double height;
  final double? startLat;
  final double? startLng;
  final double? finishLat;
  final double? finishLng;

  @override
  State<TripHistoryRouteMap> createState() => _TripHistoryRouteMapState();
}

class _TripHistoryRouteMapState extends State<TripHistoryRouteMap> {
  YandexMapController? _controller;

  List<({double lon, double lat})> get _routeLine {
    final line = <({double lon, double lat})>[];
    for (final p in widget.points) {
      if (!p.lon.isFinite || !p.lat.isFinite) continue;
      line.add((lon: p.lon, lat: p.lat));
    }
    return line;
  }

  List<MapObject> _buildMapObjects() {
    final objects = <MapObject>[];
    final zone = widget.zoneGeometry;
    if (zone != null && zone.isNotEmpty) {
      objects.addAll(
        RentalZone(
          id: 'history-zone',
          name: '',
          colorHex: '#6366F1',
          geoZoneVersionId: 'history',
          geometry: zone,
          kind: GeozoneKind.rental,
        ).buildPolygons(selected: false, onTripZoneTap: null),
      );
    }

    final route = _routeLine;
    if (route.length >= 2) {
      objects.add(
        PolylineMapObject(
          mapId: const MapObjectId('trip-history-route'),
          polyline: Polyline(
            points: [
              for (final p in route)
                Point(latitude: p.lat, longitude: p.lon),
            ],
          ),
          strokeColor: const Color(0xFF2563EB),
          strokeWidth: 4,
          zIndex: 3,
        ),
      );
      objects.add(
        PlacemarkMapObject(
          mapId: const MapObjectId('trip-history-start'),
          point: Point(latitude: route.first.lat, longitude: route.first.lon),
          opacity: 1,
          zIndex: 4,
          text: const PlacemarkText(
            text: 'A',
            style: PlacemarkTextStyle(
              size: 14,
              color: Colors.white,
              outlineColor: Color(0xFF15803D),
              placement: TextStylePlacement.top,
            ),
          ),
        ),
      );
      objects.add(
        PlacemarkMapObject(
          mapId: const MapObjectId('trip-history-finish'),
          point: Point(latitude: route.last.lat, longitude: route.last.lon),
          opacity: 1,
          zIndex: 4,
          text: const PlacemarkText(
            text: 'B',
            style: PlacemarkTextStyle(
              size: 14,
              color: Colors.white,
              outlineColor: Color(0xFFB91C1C),
              placement: TextStylePlacement.top,
            ),
          ),
        ),
      );
    } else {
      final sl = widget.startLat;
      final slg = widget.startLng;
      final fl = widget.finishLat;
      final flg = widget.finishLng;
      if (sl != null &&
          slg != null &&
          fl != null &&
          flg != null &&
          sl.isFinite &&
          slg.isFinite &&
          fl.isFinite &&
          flg.isFinite) {
        objects.add(
          PlacemarkMapObject(
            mapId: const MapObjectId('trip-history-start-only'),
            point: Point(latitude: sl, longitude: slg),
            opacity: 1,
            zIndex: 4,
            text: const PlacemarkText(
              text: 'A',
              style: PlacemarkTextStyle(
                size: 14,
                color: Colors.white,
                outlineColor: Color(0xFF15803D),
                placement: TextStylePlacement.top,
              ),
            ),
          ),
        );
        objects.add(
          PlacemarkMapObject(
            mapId: const MapObjectId('trip-history-finish-only'),
            point: Point(latitude: fl, longitude: flg),
            opacity: 1,
            zIndex: 4,
            text: const PlacemarkText(
              text: 'B',
              style: PlacemarkTextStyle(
                size: 14,
                color: Colors.white,
                outlineColor: Color(0xFFB91C1C),
                placement: TextStylePlacement.top,
              ),
            ),
          ),
        );
      }
    }

    return objects;
  }

  Future<void> _applyViewport() async {
    final c = _controller;
    if (c == null || !mounted) return;
    final route = _routeLine;
    final vp = tripRouteMapViewport(
      route: route.length >= 2
          ? route
          : () {
              final pts = <({double lon, double lat})>[];
              final sl = widget.startLat;
              final slg = widget.startLng;
              final fl = widget.finishLat;
              final flg = widget.finishLng;
              if (sl != null && slg != null && sl.isFinite && slg.isFinite) {
                pts.add((lon: slg, lat: sl));
              }
              if (fl != null && flg != null && fl.isFinite && flg.isFinite) {
                pts.add((lon: flg, lat: fl));
              }
              return pts;
            }(),
      zoneGeometry: widget.zoneGeometry,
    );
    await c.moveCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: Point(latitude: vp.centerLat, longitude: vp.centerLon),
          zoom: vp.zoom,
        ),
      ),
    );
  }

  @override
  void didUpdateWidget(covariant TripHistoryRouteMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.points != widget.points ||
        oldWidget.zoneGeometry != widget.zoneGeometry) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        // ignore: discarded_futures
        _applyViewport();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final route = _routeLine;
    final hasLine = route.length >= 2;
    final hasEndpoints = hasLine ||
        (widget.startLat != null &&
            widget.startLng != null &&
            widget.finishLat != null &&
            widget.finishLng != null);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!hasLine)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              'trip_history.map_no_route'.tr(),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ),
        SizedBox(
          height: widget.height,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: YandexMap(
              mapObjects: _buildMapObjects(),
              onMapCreated: (controller) async {
                _controller = controller;
                await _applyViewport();
              },
            ),
          ),
        ),
        if (hasEndpoints)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              'trip_history.map_legend'.tr(),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ),
      ],
    );
  }
}
