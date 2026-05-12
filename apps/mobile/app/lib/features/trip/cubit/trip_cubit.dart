import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../shared/realtime/trip_realtime_client.dart';
import '../../../shared/realtime/trip_realtime_contract.dart';
import '../../geozone/data/geozones_repository.dart';
import '../../geozone/domain/geozone_kind.dart';
import '../../geozone/domain/rental_zone.dart';
import '../../map/domain/car_position.dart';
import '../data/trips_repository.dart';
import '../domain/trip_status.dart';
import 'trip_state.dart';

class TripCubit extends Cubit<TripState> {
  TripCubit({
    required TripsRepository tripsRepository,
    required GeozonesRepository geozonesRepository,
    required TripRealtimeClient realtime,
  })  : _trips = tripsRepository,
        _geozones = geozonesRepository,
        _realtime = realtime,
        super(const TripState(zonesInView: []));

  final TripsRepository _trips;
  final GeozonesRepository _geozones;
  final TripRealtimeClient _realtime;

  StreamSubscription<Map<String, dynamic>>? _wsSub;
  String? _subscribedTripId;
  var _wsStarted = false;

  Future<void> bootstrap() async {
    await _realtime.connect();
    if (!_wsStarted) {
      _wsStarted = true;
      _wsSub = _realtime.events.listen(_onRealtime);
    }
    await refreshActiveTrip();
  }

  Future<void> refreshZones({
    required double minLon,
    required double minLat,
    required double maxLon,
    required double maxLat,
  }) async {
    emit(state.copyWith(loadingZones: true, errorMessage: null));
    try {
      final zones = await _geozones.listZonesInBoundingBox(
        minLon: minLon,
        minLat: minLat,
        maxLon: maxLon,
        maxLat: maxLat,
      );
      final selected = state.selectedZoneId;
      final stillThere = selected != null &&
          zones.any((z) => z.id == selected && z.kind == GeozoneKind.rental);
      emit(
        state.copyWith(
          zonesInView: zones,
          loadingZones: false,
          selectedZoneId: stillThere ? selected : null,
        ),
      );
    } on DioException catch (e) {
      emit(
        state.copyWith(
          loadingZones: false,
          errorMessage: e.message ?? 'Network error',
        ),
      );
    } catch (e) {
      emit(state.copyWith(loadingZones: false, errorMessage: e.toString()));
    }
  }

  void selectZone(RentalZone zone) {
    if (!zone.kind.isRental) return;
    emit(state.copyWith(selectedZoneId: zone.id, errorMessage: null));
  }

  void clearZoneSelection() {
    emit(state.copyWith(selectedZoneId: null, errorMessage: null));
  }

  void setShowRentalZones(bool value) {
    String? nextSel = state.selectedZoneId;
    if (!value && nextSel != null) {
      final match = _zoneById(nextSel);
      if (match?.kind == GeozoneKind.rental) {
        nextSel = null;
      }
    }
    emit(state.copyWith(showRentalZones: value, selectedZoneId: nextSel));
  }

  void setShowParkingZones(bool value) {
    emit(state.copyWith(showParkingZones: value));
  }

  RentalZone? _zoneById(String id) {
    for (final z in state.zonesInView) {
      if (z.id == id) return z;
    }
    return null;
  }

  Future<void> refreshActiveTrip() async {
    emit(state.copyWith(tripBusy: true, errorMessage: null));
    try {
      final prevId = state.activeTrip?.id;
      final trip = await _trips.findActiveForDriver();
      emit(state.copyWith(activeTrip: trip, tripBusy: false));
      _syncSubscription(prevId, trip?.id);
      if (trip != null) {
        try {
          final fresh = await _trips.getById(trip.id);
          emit(state.copyWith(activeTrip: fresh));
        } catch (_) {}
      }
    } on DioException catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: e.message ?? 'Network error'));
    } catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: e.toString()));
    }
  }

  Future<void> startTrip({
    required String userId,
    required CarPosition car,
    required RentalZone zone,
  }) async {
    if (!zone.kind.isRental) return;
    if (car.lat == null || car.lon == null) return;
    final ongoing = state.activeTrip;
    if (ongoing != null && ongoing.isOngoing) {
      emit(state.copyWith(errorMessage: 'trip.error.active_exists'));
      return;
    }
    emit(state.copyWith(tripBusy: true, errorMessage: null));
    try {
      final plate = car.licensePlate?.trim();
      final display = car.displayName.trim();
      final created = await _trips.create(
        userId: userId,
        carId: car.id,
        geoZoneVersionId: zone.geoZoneVersionId,
        status: TripStatusCode.started,
        startLat: _round6(car.lat),
        startLng: _round6(car.lon),
        carPlateSnapshot: plate != null && plate.isNotEmpty ? plate : null,
        carDisplayNameSnapshot: display.isNotEmpty ? display : null,
      );
      final prevId = state.activeTrip?.id;
      emit(
        state.copyWith(
          activeTrip: created,
          tripMetrics: const {},
          tripBusy: false,
          errorMessage: null,
        ),
      );
      _syncSubscription(prevId, created.id);
    } on DioException catch (e) {
      emit(state.copyWith(
        tripBusy: false,
        errorMessage: _readErrorMessage(e) ?? 'trip.error.transition_failed',
      ));
    } catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: e.toString()));
    }
  }

  /// STARTED/PENDING → ACTIVE (начать движение).
  Future<void> beginDriving() async {
    final trip = state.activeTrip;
    if (trip == null) return;
    final allowed = trip.status == TripStatusCode.started ||
        trip.status == TripStatusCode.pending;
    if (!allowed) return;
    await _patchActive({'status': TripStatusCode.active});
  }

  /// ACTIVE → PAUSED.
  Future<void> pauseTrip() async {
    final trip = state.activeTrip;
    if (trip == null || trip.status != TripStatusCode.active) return;
    await _patchActive({
      'status': TripStatusCode.paused,
      'pauseStartedAt': DateTime.now().toUtc().toIso8601String(),
    });
  }

  /// PAUSED → ACTIVE. Накапливаем totalPausedSec на стороне клиента
  /// (сервер ничего не считает сам — только хранит).
  Future<void> resumeTrip() async {
    final trip = state.activeTrip;
    if (trip == null || trip.status != TripStatusCode.paused) return;
    final base = trip.totalPausedSec;
    int extra = 0;
    final ps = trip.pauseStartedAt;
    if (ps != null) {
      final delta = DateTime.now().toUtc().difference(ps.toUtc()).inSeconds;
      if (delta > 0) extra = delta;
    }
    await _patchActive({
      'status': TripStatusCode.active,
      'pauseStartedAt': null,
      'totalPausedSec': base + extra,
    });
  }

  /// STARTED/PENDING/PAUSED → CANCELLED. Без посчитанной стоимости.
  Future<void> cancelTrip() async {
    final trip = state.activeTrip;
    if (trip == null) return;
    if (trip.status == TripStatusCode.finished ||
        trip.status == TripStatusCode.cancelled) {
      return;
    }
    emit(state.copyWith(tripBusy: true, errorMessage: null));
    try {
      await _trips.patch(trip.id, {'status': TripStatusCode.cancelled});
      final prevId = trip.id;
      emit(
        state.copyWith(
          activeTrip: null,
          tripMetrics: const {},
          tripBusy: false,
          errorMessage: null,
        ),
      );
      _syncSubscription(prevId, null);
    } on DioException catch (e) {
      emit(state.copyWith(
        tripBusy: false,
        errorMessage: _readErrorMessage(e) ?? 'trip.error.transition_failed',
      ));
    } catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: e.toString()));
    }
  }

  Future<void> finishTrip({
    double? finishLat,
    double? finishLng,
  }) async {
    final trip = state.activeTrip;
    if (trip == null || !trip.isOngoing) return;
    emit(state.copyWith(tripBusy: true, errorMessage: null));
    try {
      final body = <String, dynamic>{
        'status': TripStatusCode.finished,
        'finishedAt': DateTime.now().toUtc().toIso8601String(),
        if (finishLat != null) 'finishLat': _round6(finishLat),
        if (finishLng != null) 'finishLng': _round6(finishLng),
      };
      await _trips.patch(trip.id, body);
      final prevId = trip.id;
      emit(
        state.copyWith(
          activeTrip: null,
          tripMetrics: const {},
          tripBusy: false,
          errorMessage: null,
        ),
      );
      _syncSubscription(prevId, null);
    } on DioException catch (e) {
      emit(state.copyWith(
        tripBusy: false,
        errorMessage: _readErrorMessage(e) ?? 'trip.error.transition_failed',
      ));
    } catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: e.toString()));
    }
  }

  /// Универсальный апдейт активной поездки с обновлением стейта.
  Future<void> _patchActive(Map<String, dynamic> body) async {
    final trip = state.activeTrip;
    if (trip == null) return;
    emit(state.copyWith(tripBusy: true, errorMessage: null));
    try {
      final updated = await _trips.patch(trip.id, body);
      emit(state.copyWith(
        activeTrip: updated,
        tripBusy: false,
        errorMessage: null,
      ));
    } on DioException catch (e) {
      emit(state.copyWith(
        tripBusy: false,
        errorMessage: _readErrorMessage(e) ?? 'trip.error.transition_failed',
      ));
    } catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: e.toString()));
    }
  }

  /// Бэкенд DTO ограничивает координаты `maxDecimalPlaces: 6`.
  /// Live-точки из WS могут содержать больше знаков → округляем перед PATCH/POST.
  static double? _round6(double? v) {
    if (v == null) return null;
    return double.parse(v.toStringAsFixed(6));
  }

  static String? _readErrorMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map) {
      final m = data['message'];
      if (m is String && m.isNotEmpty) return m;
      if (m is List && m.isNotEmpty) return m.first.toString();
    }
    return e.message;
  }

  void clearError() {
    emit(state.copyWith(errorMessage: null));
  }

  void _syncSubscription(String? previousId, String? nextId) {
    if (previousId != null && previousId != nextId) {
      _realtime.unsubscribeTrip(previousId);
    }
    if (nextId != null && nextId != _subscribedTripId) {
      _realtime.subscribeTrip(nextId);
      _subscribedTripId = nextId;
    }
    if (nextId == null) {
      _subscribedTripId = null;
    }
  }

  void _onRealtime(Map<String, dynamic> e) {
    final eventName = e['event']?.toString() ?? '';
    final tripId = _readTripId(e);
    final activeId = state.activeTrip?.id;
    if (activeId != null && tripId != null && tripId != activeId) {
      return;
    }

    if (eventName == TripWsEvent.tripMetricsUpdated) {
      final payload = _payloadMap(e);
      if (payload.isEmpty) return;
      emit(
        state.copyWith(
          tripMetrics: {...state.tripMetrics, ...payload},
        ),
      );
    }

    if (eventName == TripWsEvent.tripStateChanged ||
        eventName == TripWsEvent.tripFinished) {
      if (activeId != null) {
        unawaited(_reloadTrip(activeId));
      }
    }
  }

  Future<void> _reloadTrip(String id) async {
    try {
      final t = await _trips.getById(id);
      if (!t.isOngoing) {
        emit(state.copyWith(activeTrip: null, tripMetrics: const {}));
        _syncSubscription(id, null);
      } else {
        emit(state.copyWith(activeTrip: t));
      }
    } catch (_) {}
  }

  static Map<String, dynamic> _payloadMap(Map<String, dynamic> e) {
    final p = e['payload'];
    if (p is Map) {
      return p.map((k, v) => MapEntry(k.toString(), v));
    }
    final out = <String, dynamic>{};
    for (final en in e.entries) {
      if (en.key == 'event') continue;
      out[en.key] = en.value;
    }
    return out;
  }

  static String? _readTripId(Map<String, dynamic> e) {
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

  @override
  Future<void> close() async {
    await _wsSub?.cancel();
    final id = state.activeTrip?.id ?? _subscribedTripId;
    if (id != null) {
      _realtime.unsubscribeTrip(id);
    }
    return super.close();
  }
}
