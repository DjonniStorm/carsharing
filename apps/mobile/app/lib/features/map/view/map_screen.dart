import 'dart:async';
import 'dart:developer' as developer;
import 'dart:math' as math;

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';

import '../../../app/router/app_routes.dart';
import '../../../shared/config/map_defaults.dart';
import '../../profile/cubit/profile_cubit.dart';
import '../../profile/cubit/profile_state.dart';
import '../../trip/cubit/trip_cubit.dart';
import '../../trip/cubit/trip_state.dart';
import '../../trip/domain/live_trip_metrics.dart';
import '../../trip/domain/trip_read.dart';
import '../../trip/domain/trip_status.dart';
import '../cubit/map_cubit.dart';
import '../cubit/map_state.dart';
import '../domain/car_position.dart';
import '../../geozone/domain/geozone_kind.dart';
import 'car_chip_icon.dart';
import 'car_preview_sheet.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  YandexMapController? _mapController;
  Timer? _zoneDebounce;
  final CarChipIconCache _carIcons = CarChipIconCache();
  bool _carIconJobInFlight = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      developer.log('postFrame fired, mounted=$mounted', name: 'MapScreen');
      if (!mounted) return;
      try {
        await context.read<MapCubit>().init();
      } catch (e, st) {
        developer.log('MapCubit.init() threw: $e', name: 'MapScreen', error: e, stackTrace: st);
      }
      if (!mounted) return;
      try {
        await context.read<TripCubit>().bootstrap();
      } catch (e, st) {
        developer.log('TripCubit.bootstrap() threw: $e', name: 'MapScreen', error: e, stackTrace: st);
      }
    });
  }

  @override
  void dispose() {
    _zoneDebounce?.cancel();
    super.dispose();
  }

  Future<void> _reloadZonesForVisibleArea() async {
    final c = _mapController;
    if (!mounted || c == null) return;
    final vr = await c.getVisibleRegion();
    if (!mounted) return;
    final corners = [vr.topLeft, vr.topRight, vr.bottomLeft, vr.bottomRight];
    final minLon = corners.map((p) => p.longitude).reduce(math.min);
    final maxLon = corners.map((p) => p.longitude).reduce(math.max);
    final minLat = corners.map((p) => p.latitude).reduce(math.min);
    final maxLat = corners.map((p) => p.latitude).reduce(math.max);
    await context.read<TripCubit>().refreshZones(
          minLon: minLon,
          minLat: minLat,
          maxLon: maxLon,
          maxLat: maxLat,
        );
  }

  void _debouncedZonesReload() {
    _zoneDebounce?.cancel();
    _zoneDebounce = Timer(const Duration(milliseconds: 450), () {
      // ignore: discarded_futures
      _reloadZonesForVisibleArea();
    });
  }

  Future<void> _onCarCircleTap(CarPosition car) async {
    final trip = context.read<TripCubit>();
    final zone = trip.state.selectedZone;
    if (car.lat == null || car.lon == null) return;

    if (zone == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('map.select_zone_to_start'.tr())),
      );
      return;
    }
    if (!zone.containsLonLat(car.lon!, car.lat!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('map.car_outside_zone'.tr())),
      );
      return;
    }

    final canSelect = car.isAvailable;
    final picked = await showCarPreviewSheet(
      context,
      car: car,
      canSelect: canSelect,
    );
    if (!mounted) return;
    if (picked != true) {
      if (!canSelect) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('map.car_not_available'.tr())),
        );
      }
      return;
    }

    final profileState = context.read<ProfileCubit>().state;
    final userId = switch (profileState) {
      ProfileLoaded(:final user) => user.id,
      ProfileUpdated(:final user) => user.id,
      _ => null,
    };
    if (userId == null || userId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('map.profile_required'.tr())),
      );
      return;
    }

    await trip.startTrip(userId: userId, car: car, zone: zone);
    if (!context.mounted) return;
  }

  Future<void> _zoomIn() async {
    final c = _mapController;
    if (c == null) return;
    await c.moveCamera(CameraUpdate.zoomIn());
  }

  Future<void> _zoomOut() async {
    final c = _mapController;
    if (c == null) return;
    await c.moveCamera(CameraUpdate.zoomOut());
  }

  Future<void> _onFinishTrip(TripRead trip) async {
    final map = context.read<MapCubit>().state;
    final car = map.cars[trip.carId];
    await context.read<TripCubit>().finishTrip(
          finishLat: car?.lat,
          finishLng: car?.lon,
        );
    if (!mounted) return;
    await context.read<MapCubit>().refresh();
  }

  Future<void> _onCancelTrip() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          content: Text('trip.confirm_cancel'.tr()),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: Text('common.cancel'.tr()),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: Text('trip.cancel'.tr()),
            ),
          ],
        );
      },
    );
    if (confirmed != true || !mounted) return;
    await context.read<TripCubit>().cancelTrip();
    if (!mounted) return;
    await context.read<MapCubit>().refresh();
  }

  Future<void> _onBeginDriving() async {
    await context.read<TripCubit>().beginDriving();
  }

  Future<void> _onPauseTrip() async {
    await context.read<TripCubit>().pauseTrip();
  }

  Future<void> _onResumeTrip() async {
    await context.read<TripCubit>().resumeTrip();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<TripCubit, TripState>(
          listenWhen: (p, c) =>
              c.errorMessage != null && c.errorMessage != p.errorMessage,
          listener: (context, state) {
            final msg = state.errorMessage;
            if (msg == null || msg.isEmpty) return;
            final text = msg.contains('.') ? msg.tr() : msg;
            final trip = context.read<TripCubit>();
            final pending = state.pendingRetry;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(text),
                action: pending != null
                    ? SnackBarAction(
                        label: 'common.retry'.tr(),
                        onPressed: () {
                          // ignore: discarded_futures
                          trip.retryPendingAction();
                        },
                      )
                    : null,
              ),
            );
            trip.clearError();
          },
        ),
        BlocListener<TripCubit, TripState>(
          listenWhen: (p, c) =>
              c.finishSummary != null && c.finishSummary != p.finishSummary,
          listener: (context, state) {
            final summary = state.finishSummary;
            if (summary == null) return;
            final km = summary.distanceKm?.toStringAsFixed(2) ?? '—';
            final price = summary.priceTotal?.toStringAsFixed(0) ?? '—';
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                duration: const Duration(seconds: 5),
                content: Text(
                  'trip.finish_summary'.tr(
                    namedArgs: {'km': km, 'price': price},
                  ),
                ),
              ),
            );
            context.read<TripCubit>().clearFinishSummary();
          },
        ),
      ],
      child: Scaffold(
        body: Stack(
          children: [
            Positioned.fill(
              child: BlocBuilder<MapCubit, MapState>(
                builder: (context, mapState) {
                  return BlocBuilder<TripCubit, TripState>(
                    builder: (context, tripState) {
                      final objects = <MapObject>[
                        ..._tripBoundZoneObjects(tripState),
                        ..._zoneObjects(tripState),
                        ..._carObjects(mapState, tripState),
                      ];

                      return YandexMap(
                        mapObjects: objects,
                        onMapCreated: (c) async {
                          _mapController = c;
                          await c.moveCamera(
                            CameraUpdate.newCameraPosition(
                              const CameraPosition(
                                target: Point(
                                  latitude: MapDefaults.centerLatitude,
                                  longitude: MapDefaults.centerLongitude,
                                ),
                                zoom: MapDefaults.zoom,
                              ),
                            ),
                          );
                          await _reloadZonesForVisibleArea();
                        },
                        onCameraPositionChanged: (camera, reason, finished) {
                          if (finished) {
                            _debouncedZonesReload();
                          }
                        },
                      );
                    },
                  );
                },
              ),
            ),
            Positioned(
              top: MediaQuery.paddingOf(context).top + 12,
              right: 12,
              child: BlocBuilder<ProfileCubit, ProfileState>(
                builder: (context, ps) {
                  final letter = switch (ps) {
                    ProfileLoaded(:final user) =>
                      user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                    ProfileUpdated(:final user) =>
                      user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                    _ => '?',
                  };
                  return Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Material(
                        color: Theme.of(context).colorScheme.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(12),
                        clipBehavior: Clip.antiAlias,
                        child: IconButton(
                          tooltip: 'map.trip_history'.tr(),
                          onPressed: () => context.push(AppRoutes.trips),
                          icon: const Icon(Icons.history),
                        ),
                      ),
                      const SizedBox(height: 8),
                      _AvatarButton(
                        letter: letter,
                        onTap: () => context.push(AppRoutes.profile),
                      ),
                    ],
                  );
                },
              ),
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: EdgeInsets.only(
                  left: 12,
                  right: 12,
                  bottom: MediaQuery.paddingOf(context).bottom + 12,
                ),
                child: BlocBuilder<TripCubit, TripState>(
                  builder: (context, tripState) {
                    return BlocBuilder<MapCubit, MapState>(
                      buildWhen: (p, c) {
                        final id = tripState.activeTrip?.carId;
                        if (id == null) return false;
                        return p.cars[id] != c.cars[id];
                      },
                      builder: (context, mapState) {
                        final activeCar = tripState.activeTrip == null
                            ? null
                            : mapState.cars[tripState.activeTrip!.carId];
                        return _TripBottomPanel(
                          tripState: tripState,
                          activeCar: activeCar,
                          onFinish: _onFinishTrip,
                          onCancel: _onCancelTrip,
                          onBeginDriving: _onBeginDriving,
                          onPause: _onPauseTrip,
                          onResume: _onResumeTrip,
                        );
                      },
                    );
                  },
                ),
              ),
            ),
            Positioned(
              top: MediaQuery.paddingOf(context).top + 12,
              left: 12,
              child: BlocBuilder<MapCubit, MapState>(
                builder: (context, s) {
                  return BlocBuilder<TripCubit, TripState>(
                    builder: (context, ts) {
                      final maxPanelWidth =
                          (MediaQuery.sizeOf(context).width - 100)
                              .clamp(160.0, 280.0);
                      return SizedBox(
                        width: maxPanelWidth,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (s.loading || ts.loadingZones)
                              Card(
                                margin: EdgeInsets.zero,
                                child: Padding(
                                  padding: const EdgeInsets.all(8),
                                  child: SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .primary,
                                    ),
                                  ),
                                ),
                              ),
                            if (s.loading || ts.loadingZones)
                              const SizedBox(height: 8),
                            Card(
                              margin: EdgeInsets.zero,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 6,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Row(
                                      children: [
                                        Checkbox(
                                          materialTapTargetSize:
                                              MaterialTapTargetSize.shrinkWrap,
                                          visualDensity: VisualDensity.compact,
                                          value: ts.showRentalZones,
                                          onChanged: ts.loadingZones
                                              ? null
                                              : (v) => context
                                                  .read<TripCubit>()
                                                  .setShowRentalZones(
                                                      v ?? true),
                                        ),
                                        Expanded(
                                          child: Text(
                                            'map.filter_rental'.tr(),
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall,
                                          ),
                                        ),
                                      ],
                                    ),
                                    Row(
                                      children: [
                                        Checkbox(
                                          materialTapTargetSize:
                                              MaterialTapTargetSize.shrinkWrap,
                                          visualDensity: VisualDensity.compact,
                                          value: ts.showParkingZones,
                                          onChanged: ts.loadingZones
                                              ? null
                                              : (v) => context
                                                  .read<TripCubit>()
                                                  .setShowParkingZones(
                                                      v ?? true),
                                        ),
                                        Expanded(
                                          child: Text(
                                            'map.filter_parking'.tr(),
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
            Positioned(
              right: 12,
              top: 0,
              bottom: 0,
              width: 48,
              child: Center(
                child: Material(
                  elevation: 4,
                  borderRadius: BorderRadius.circular(10),
                  color:
                      Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        tooltip: 'map.zoom_in'.tr(),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 44,
                          minHeight: 44,
                        ),
                        onPressed: () {
                          // ignore: discarded_futures
                          _zoomIn();
                        },
                        icon: const Icon(Icons.add),
                      ),
                      const Divider(height: 1),
                      IconButton(
                        tooltip: 'map.zoom_out'.tr(),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 44,
                          minHeight: 44,
                        ),
                        onPressed: () {
                          // ignore: discarded_futures
                          _zoomOut();
                        },
                        icon: const Icon(Icons.remove),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<MapObject> _tripBoundZoneObjects(TripState tripState) {
    final trip = tripState.activeTrip;
    final bound = tripState.tripBoundZone;
    if (trip == null || !trip.isOngoing || bound == null) {
      return const [];
    }
    return bound.buildPolygons(
      selected: true,
      isTripContract: true,
      onTripZoneTap: null,
    );
  }

  List<MapObject> _zoneObjects(TripState tripState) {
    final selectedId = tripState.selectedZoneId;
    final trip = context.read<TripCubit>();
    final boundVersionId = tripState.tripBoundZone?.geoZoneVersionId;
    final objects = <MapObject>[];
    for (final zone in tripState.zonesInView) {
      if (boundVersionId != null &&
          boundVersionId.isNotEmpty &&
          zone.geoZoneVersionId == boundVersionId) {
        continue;
      }
      final visible = (zone.kind == GeozoneKind.rental &&
              tripState.showRentalZones) ||
          (zone.kind == GeozoneKind.parking && tripState.showParkingZones);
      if (!visible) continue;

      objects.addAll(
        zone.buildPolygons(
          selected:
              zone.kind == GeozoneKind.rental && zone.id == selectedId,
          onTripZoneTap: zone.kind == GeozoneKind.rental
              ? (z) => trip.selectZone(z)
              : null,
        ),
      );
    }
    return objects;
  }

  List<MapObject> _carObjects(MapState mapState, TripState tripState) {
    final activeTrip = tripState.activeTrip;
    final ongoing = activeTrip?.isOngoing ?? false;

    if (ongoing && activeTrip != null) {
      return _myCarObjects(mapState, activeTrip);
    }

    if (!tripState.showRentalZones) return [];
    final rentalZones = tripState.zonesInView
        .where((z) => z.kind == GeozoneKind.rental)
        .toList(growable: false);
    if (rentalZones.isEmpty) return [];

    final selected = tripState.selectedZone;

    final visibleCars = <({CarPosition car, bool inSelected})>[];
    for (final car in mapState.cars.values) {
      if (car.isDeleted) continue;
      if (!car.isAvailable) continue;
      final lat = car.lat;
      final lon = car.lon;
      if (lat == null || lon == null) continue;

      bool inAnyRental = false;
      for (final z in rentalZones) {
        if (z.containsLonLat(lon, lat)) {
          inAnyRental = true;
          break;
        }
      }
      if (!inAnyRental) continue;

      final inSelected =
          selected != null && selected.containsLonLat(lon, lat);
      visibleCars.add((car: car, inSelected: inSelected));
    }

    _ensureCarIconsFor(visibleCars, hasSelectedZone: selected != null);

    final objects = <MapObject>[];
    for (final entry in visibleCars) {
      final car = entry.car;
      final plate = car.licensePlate?.trim() ?? '';
      final selectedZoneActive = selected != null;
      final muted = selectedZoneActive && !entry.inSelected;
      final hl = selectedZoneActive && entry.inSelected;

      final icon = _carIcons.get(plate, selected: hl, muted: muted);
      if (icon == null) continue;

      objects.add(
        PlacemarkMapObject(
          mapId: MapObjectId('car-${car.id}'),
          point: Point(latitude: car.lat!, longitude: car.lon!),
          opacity: 1,
          zIndex: hl ? 25 : 20,
          icon: PlacemarkIcon.single(
            PlacemarkIconStyle(
              image: icon,
              anchor: CarChipIconCache.anchor,
              scale: 1,
            ),
          ),
          consumeTapEvents: true,
          onTap: (_, __) {
            // ignore: discarded_futures
            _onCarCircleTap(car);
          },
        ),
      );
    }
    developer.log(
      'carObjects=${objects.length}, visible=${visibleCars.length}, '
      'totalCars=${mapState.cars.length}',
      name: 'MapScreen',
    );
    return objects;
  }

  /// Маркер «своей» машины во время активной поездки.
  /// Рисуется всегда, даже если телеметрия увела машину за пределы зон.
  List<MapObject> _myCarObjects(MapState mapState, TripRead activeTrip) {
    final car = mapState.cars[activeTrip.carId];

    final lat = car?.lat ?? activeTrip.startLat;
    final lon = car?.lon ?? activeTrip.startLng;
    if (lat == null || lon == null) {
      developer.log(
        'myCar no coords (carId=${activeTrip.carId})',
        name: 'MapScreen',
      );
      return [];
    }

    final plate = (car?.licensePlate?.trim().isNotEmpty == true
            ? car!.licensePlate!.trim()
            : activeTrip.carPlateSnapshot?.trim()) ??
        '';

    _ensureMineIcon(plate);
    final icon = _carIcons.get(plate, selected: false, muted: false, mine: true);
    if (icon == null) return const [];

    return [
      PlacemarkMapObject(
        mapId: MapObjectId('my-car-${activeTrip.carId}'),
        point: Point(latitude: lat, longitude: lon),
        opacity: 1,
        zIndex: 30,
        icon: PlacemarkIcon.single(
          PlacemarkIconStyle(
            image: icon,
            anchor: CarChipIconCache.anchor,
            scale: 1,
          ),
        ),
      ),
    ];
  }

  void _ensureMineIcon(String plate) {
    if (_carIcons.get(plate, selected: false, muted: false, mine: true) !=
        null) {
      return;
    }
    if (_carIconJobInFlight) return;
    _carIconJobInFlight = true;
    () async {
      try {
        final changed = await _carIcons.ensure([
          (plate: plate, selected: false, muted: false, mine: true),
        ]);
        if (changed && mounted) setState(() {});
      } finally {
        _carIconJobInFlight = false;
      }
    }();
  }

  void _ensureCarIconsFor(
    List<({CarPosition car, bool inSelected})> entries, {
    required bool hasSelectedZone,
  }) {
    if (_carIconJobInFlight) return;
    final items = <({String plate, bool selected, bool muted, bool mine})>{};
    for (final e in entries) {
      final plate = e.car.licensePlate?.trim() ?? '';
      final muted = hasSelectedZone && !e.inSelected;
      final hl = hasSelectedZone && e.inSelected;
      items.add((plate: plate, selected: hl, muted: muted, mine: false));
    }
    final missing = items
        .where(
          (it) => _carIcons.get(
                it.plate,
                selected: it.selected,
                muted: it.muted,
                mine: it.mine,
              ) ==
              null,
        )
        .toList(growable: false);
    if (missing.isEmpty) return;

    _carIconJobInFlight = true;
    () async {
      try {
        final changed = await _carIcons.ensure(missing);
        if (changed && mounted) setState(() {});
      } finally {
        _carIconJobInFlight = false;
      }
    }();
  }
}

class _TripBottomPanel extends StatelessWidget {
  const _TripBottomPanel({
    required this.tripState,
    required this.activeCar,
    required this.onFinish,
    required this.onCancel,
    required this.onBeginDriving,
    required this.onPause,
    required this.onResume,
  });

  final TripState tripState;
  final CarPosition? activeCar;
  final Future<void> Function(TripRead trip) onFinish;
  final Future<void> Function() onCancel;
  final Future<void> Function() onBeginDriving;
  final Future<void> Function() onPause;
  final Future<void> Function() onResume;

  @override
  Widget build(BuildContext context) {
    final trip = tripState.activeTrip;
    if (trip != null && trip.isOngoing) {
      return _activeTripCard(context, trip);
    }

    if (tripState.tripBusy) {
      return Card(
        elevation: 6,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              const SizedBox(width: 12),
              Expanded(child: Text('map.trip_working'.tr())),
            ],
          ),
        ),
      );
    }

    if (!tripState.showRentalZones) {
      return Card(
        elevation: 6,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Text(
            'map.rental_layers_off_hint'.tr(),
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      );
    }

    if (tripState.selectedZone == null) {
      return Card(
        elevation: 6,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Text(
            'map.select_zone_hint'.tr(),
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      );
    }

    final zone = tripState.selectedZone!;
    return Card(
      elevation: 6,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (zone.hasTariff) ...[
              Text(
                zone.name.isNotEmpty ? zone.name : 'map.zone_tariff_title'.tr(),
                style: Theme.of(context).textTheme.titleSmall,
              ),
              if (zone.name.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  'map.zone_tariff_title'.tr(),
                  style: Theme.of(context).textTheme.labelSmall,
                ),
              ],
              const SizedBox(height: 8),
              if (zone.pricePerMinute != null)
                Text(
                  'map.tariff_per_minute'.tr(
                    args: [_formatPrice(zone.pricePerMinute!)],
                  ),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              if (zone.pricePerKm != null)
                Text(
                  'map.tariff_per_km'.tr(
                    args: [_formatPrice(zone.pricePerKm!)],
                  ),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              if (zone.pausePricePerMinute != null)
                Text(
                  'map.tariff_pause'.tr(
                    args: [_formatPrice(zone.pausePricePerMinute!)],
                  ),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              const SizedBox(height: 8),
            ],
            Text(
              'map.select_car_hint'.tr(),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }

  static String _formatPrice(double v) {
    final rounded = (v * 10).round() / 10;
    if (rounded == rounded.roundToDouble()) {
      return rounded.toInt().toString();
    }
    return rounded.toStringAsFixed(1);
  }

  Widget _activeTripCard(BuildContext context, TripRead trip) {
    final metrics = tripState.displayMetrics;
    final km = metrics?.distanceKm != null
        ? metrics!.distanceKm!.toStringAsFixed(2)
        : trip.distance.toStringAsFixed(2);
    final price = metrics?.priceTotal ?? trip.priceTotal;
    final busy = tripState.tripBusy;

    final plateFromSnap = trip.carPlateSnapshot?.trim();
    final plateFromCar = activeCar?.licensePlate?.trim();
    final plate = (plateFromCar?.isNotEmpty ?? false)
        ? plateFromCar
        : ((plateFromSnap?.isNotEmpty ?? false) ? plateFromSnap : null);
    final modelLabel = activeCar?.displayName.trim().isNotEmpty == true
        ? activeCar!.displayName.trim()
        : (trip.carDisplayNameSnapshot ?? '');

    return Card(
      elevation: 6,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'map.active_trip'.tr(),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                _StatusBadge(status: trip.status),
              ],
            ),
            if (plate != null || modelLabel.isNotEmpty) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  if (plate != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .primaryContainer
                            .withAlpha(180),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        plate,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                            ),
                      ),
                    ),
                  if (plate != null && modelLabel.isNotEmpty)
                    const SizedBox(width: 8),
                  if (modelLabel.isNotEmpty)
                    Expanded(
                      child: Text(
                        modelLabel,
                        style: Theme.of(context).textTheme.bodySmall,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
              ),
            ],
            if (activeCar != null) ...[
              const SizedBox(height: 8),
              _CarMonitorRow(car: activeCar!),
            ],
            const SizedBox(height: 8),
            _TripMetricsRow(km: km, price: price),
            if (metrics != null &&
                (metrics.chargedMinutes != null || metrics.pricePause != null)) ...[
              const SizedBox(height: 6),
              _TripBillingDetailsRow(metrics: metrics),
            ],
            const SizedBox(height: 10),
            if (busy)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 4),
                child: LinearProgressIndicator(minHeight: 2),
              ),
            Wrap(
              alignment: WrapAlignment.end,
              spacing: 8,
              runSpacing: 8,
              children: _actionButtons(context, trip, busy),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _actionButtons(
    BuildContext context,
    TripRead trip,
    bool busy,
  ) {
    final widgets = <Widget>[];
    final isStartedOrPending = trip.status == TripStatusCode.started ||
        trip.status == TripStatusCode.pending;
    final isActive = trip.status == TripStatusCode.active;
    final isPaused = trip.status == TripStatusCode.paused;

    if (isStartedOrPending) {
      widgets.add(
        OutlinedButton(
          onPressed: busy ? null : onCancel,
          child: Text('trip.cancel'.tr()),
        ),
      );
      widgets.add(
        FilledButton.icon(
          onPressed: busy ? null : onBeginDriving,
          icon: const Icon(Icons.play_arrow_rounded),
          label: Text('trip.begin_driving'.tr()),
        ),
      );
      return widgets;
    }

    if (isActive) {
      widgets.add(
        OutlinedButton.icon(
          onPressed: busy ? null : onPause,
          icon: const Icon(Icons.pause_rounded),
          label: Text('trip.pause'.tr()),
        ),
      );
    }
    if (isPaused) {
      widgets.add(
        FilledButton.icon(
          onPressed: busy ? null : onResume,
          icon: const Icon(Icons.play_arrow_rounded),
          label: Text('trip.resume'.tr()),
        ),
      );
    }
    widgets.add(
      FilledButton.icon(
        onPressed: busy
            ? null
            : () {
                // ignore: discarded_futures
                onFinish(trip);
              },
        icon: const Icon(Icons.stop_rounded),
        label: Text('trip.finish'.tr()),
        style: FilledButton.styleFrom(
          backgroundColor: Theme.of(context).colorScheme.error,
          foregroundColor: Theme.of(context).colorScheme.onError,
        ),
      ),
    );
    return widgets;
  }
}

class _MonitorChip extends StatelessWidget {
  const _MonitorChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withAlpha(160), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}

class _CarMonitorRow extends StatelessWidget {
  const _CarMonitorRow({required this.car});

  final CarPosition car;

  static Color _fuelColor(BuildContext context, double level) {
    final cs = Theme.of(context).colorScheme;
    if (level <= 15) return cs.error;
    if (level <= 35) return cs.tertiary;
    return cs.primary;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final chips = <Widget>[];

    final fuel = car.fuelLevel;
    if (fuel != null) {
      chips.add(_MonitorChip(
        icon: Icons.local_gas_station_rounded,
        label: '${fuel.toStringAsFixed(0)}%',
        color: _fuelColor(context, fuel),
      ));
    }
    final speed = car.speedKmh;
    if (speed != null) {
      chips.add(_MonitorChip(
        icon: Icons.speed_rounded,
        label: 'car.current_speed'.tr(
          args: [speed.toStringAsFixed(0)],
        ),
        color: cs.primary,
      ));
    }
    final mileage = car.mileage;
    if (mileage != null) {
      chips.add(_MonitorChip(
        icon: Icons.straighten_rounded,
        label: 'car.odometer_km'.tr(
          args: [mileage.toStringAsFixed(0)],
        ),
        color: cs.onSurfaceVariant,
      ));
    }
    final color = car.color?.trim();
    if (color != null && color.isNotEmpty) {
      chips.add(_MonitorChip(
        icon: Icons.palette_outlined,
        label: color,
        color: cs.onSurfaceVariant,
      ));
    }
    if (chips.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: chips,
    );
  }
}

class _TripBillingDetailsRow extends StatelessWidget {
  const _TripBillingDetailsRow({required this.metrics});

  final LiveTripMetrics metrics;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        );
    final parts = <String>[];
    final mins = metrics.chargedMinutes;
    if (mins != null) {
      parts.add('trip.charged_minutes'.tr(args: [mins.toStringAsFixed(0)]));
    }
    final kmCharged = metrics.chargedKm;
    if (kmCharged != null) {
      parts.add('trip.charged_km'.tr(args: [kmCharged.toStringAsFixed(2)]));
    }
    final pause = metrics.pricePause;
    if (pause != null && pause > 0) {
      parts.add('trip.price_pause'.tr(args: [pause.toStringAsFixed(0)]));
    }
    if (parts.isEmpty) return const SizedBox.shrink();
    return Text(parts.join(' · '), style: style);
  }
}

class _TripMetricsRow extends StatelessWidget {
  const _TripMetricsRow({required this.km, required this.price});

  final String km;
  final double? price;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final chips = <Widget>[
      _MonitorChip(
        icon: Icons.straighten_rounded,
        label: '$km ${'car.km'.tr()}',
        color: cs.primary,
      ),
    ];
    if (price != null) {
      chips.add(_MonitorChip(
        icon: Icons.payments_outlined,
        label: '${price!.toStringAsFixed(2)} ₽',
        color: cs.secondary,
      ));
    }
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: chips,
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final int status;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final (label, color) = switch (status) {
      TripStatusCode.pending => ('trip.status.pending'.tr(), cs.tertiary),
      TripStatusCode.started => ('trip.status.started'.tr(), cs.tertiary),
      TripStatusCode.active => ('trip.status.active'.tr(), cs.primary),
      TripStatusCode.paused => ('trip.status.paused'.tr(), cs.secondary),
      _ => (status.toString(), cs.outline),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withAlpha(40),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color, width: 1),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

class _AvatarButton extends StatelessWidget {
  const _AvatarButton({
    required this.letter,
    required this.onTap,
  });

  final String letter;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: CircleAvatar(
        radius: 22,
        backgroundColor: const Color(0xFF6D28D9),
        child: Text(
          letter,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
        ),
      ),
    );
  }
}
