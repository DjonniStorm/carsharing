import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../shared/api/dio_error_message.dart';
import '../../../shared/network/retry.dart';
import '../../../shared/realtime/parse_trip_ws.dart';
import '../../../shared/realtime/trip_realtime_client.dart';
import '../../../shared/realtime/trip_realtime_contract.dart';
import '../../geozone/data/geozones_repository.dart';
import '../../geozone/domain/geozone_kind.dart';
import '../../geozone/domain/rental_zone.dart';
import '../../map/domain/car_position.dart';
import '../data/trips_repository.dart';
import '../domain/live_trip_metrics.dart';
import '../domain/trip_pending_action.dart';
import '../domain/trip_status.dart';
import 'trip_state.dart';

class TripCubit extends Cubit<TripState> {
  TripCubit({
    required TripsRepository tripsRepository,
    required GeozonesRepository geozonesRepository,
    required TripRealtimeClient realtime,
  }) : _trips = tripsRepository,
       _geozones = geozonesRepository,
       _realtime = realtime,
       super(const TripState(zonesInView: []));

  static const _metricsUiThrottleMs = 150;

  final TripsRepository _trips;
  final GeozonesRepository _geozones;
  final TripRealtimeClient _realtime;

  StreamSubscription<Map<String, dynamic>>? _wsSub;
  String? _subscribedTripId;
  var _wsStarted = false;
  final Map<String, int> _lastMetricsUiMsByTrip = {};

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
      final stillThere =
          selected != null &&
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
        state.copyWith(loadingZones: false, errorMessage: dioErrorMessage(e)),
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

  void clearFinishSummary() {
    emit(state.copyWith(finishSummary: null));
  }

  RentalZone? _zoneById(String id) {
    for (final z in state.zonesInView) {
      if (z.id == id) return z;
    }
    return null;
  }

  RentalZone? _styleHintForVersion(String versionId) {
    for (final z in state.zonesInView) {
      if (z.geoZoneVersionId == versionId) return z;
    }
    for (final z in state.zonesInView) {
      if (z.kind == GeozoneKind.rental) return z;
    }
    return state.tripBoundZone;
  }

  Future<RentalZone?> _loadTripBoundZone(String versionId) async {
    if (versionId.isEmpty) return null;
    return _geozones.rentalZoneForTripVersion(
      versionId,
      styleFrom: _styleHintForVersion(versionId),
    );
  }

  Future<void> refreshActiveTrip() async {
    emit(state.copyWith(tripBusy: true, errorMessage: null));
    try {
      final prevId = state.activeTrip?.id;
      final trip = await _trips.findActiveForDriver();
      emit(
        state.copyWith(
          activeTrip: trip,
          tripBoundZone: null,
          liveMetrics: null,
          tripBusy: false,
        ),
      );
      _syncSubscription(prevId, trip?.id);
      if (trip != null && trip.isOngoing) {
        try {
          final fresh = await _trips.getById(trip.id);
          final bound = await _loadTripBoundZone(fresh.geoZoneVersionId);
          emit(state.copyWith(activeTrip: fresh, tripBoundZone: bound));
        } catch (_) {
          final bound = await _loadTripBoundZone(trip.geoZoneVersionId);
          emit(state.copyWith(tripBoundZone: bound));
        }
      } else {
        emit(state.copyWith(tripBoundZone: null));
      }
    } on DioException catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: dioErrorMessage(e)));
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
    emit(
      state.copyWith(tripBusy: true, errorMessage: null, pendingRetry: null),
    );
    try {
      final plate = car.licensePlate?.trim();
      final display = car.displayName.trim();
      final created = await withNetworkRetry(
        () => _trips.create(
          userId: userId,
          carId: car.id,
          geoZoneVersionId: zone.geoZoneVersionId,
          status: TripStatusCode.started,
          startLat: _round6(car.lat),
          startLng: _round6(car.lon),
          carPlateSnapshot: plate != null && plate.isNotEmpty ? plate : null,
          carDisplayNameSnapshot: display.isNotEmpty ? display : null,
        ),
      );
      final prevId = state.activeTrip?.id;
      _lastMetricsUiMsByTrip.remove(created.id);
      final bound = await _loadTripBoundZone(created.geoZoneVersionId);
      emit(
        state.copyWith(
          activeTrip: created,
          tripBoundZone: bound ?? zone,
          liveMetrics: null,
          finishSummary: null,
          selectedZoneId: null,
          tripBusy: false,
          errorMessage: null,
          pendingRetry: null,
        ),
      );
      _syncSubscription(prevId, created.id);
    } on DioException catch (e) {
      _failTripTransition(
        e,
        pending: TripPendingStart(userId: userId, car: car, zone: zone),
      );
    } catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: e.toString()));
    }
  }

  Future<void> retryPendingAction() async {
    final pending = state.pendingRetry;
    if (pending == null) return;
    switch (pending) {
      case TripPendingStart(:final userId, :final car, :final zone):
        await startTrip(userId: userId, car: car, zone: zone);
      case TripPendingFinish(:final finishLat, :final finishLng):
        await finishTrip(finishLat: finishLat, finishLng: finishLng);
      case TripPendingCancel():
        await cancelTrip();
      case TripPendingPatch(:final body):
        await _patchActive(body);
    }
  }

  Future<void> beginDriving() async {
    final trip = state.activeTrip;
    if (trip == null) return;
    final allowed =
        trip.status == TripStatusCode.started ||
        trip.status == TripStatusCode.pending;
    if (!allowed) return;
    await _patchActive({'status': TripStatusCode.active});
  }

  Future<void> pauseTrip() async {
    final trip = state.activeTrip;
    if (trip == null || trip.status != TripStatusCode.active) return;
    await _patchActive({
      'status': TripStatusCode.paused,
      'pauseStartedAt': DateTime.now().toUtc().toIso8601String(),
    });
  }

  /// PAUSED => ACTIVE; `totalPausedSec` нужен бэкенду для pricing pause.
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

  Future<void> cancelTrip() async {
    final trip = state.activeTrip;
    if (trip == null) return;
    if (trip.status == TripStatusCode.finished ||
        trip.status == TripStatusCode.cancelled) {
      return;
    }
    emit(
      state.copyWith(tripBusy: true, errorMessage: null, pendingRetry: null),
    );
    try {
      await withNetworkRetry(
        () => _trips.patch(trip.id, {'status': TripStatusCode.cancelled}),
      );
      final prevId = trip.id;
      _lastMetricsUiMsByTrip.remove(prevId);
      emit(
        state.copyWith(
          activeTrip: null,
          tripBoundZone: null,
          liveMetrics: null,
          tripBusy: false,
          errorMessage: null,
          pendingRetry: null,
        ),
      );
      _syncSubscription(prevId, null);
    } on DioException catch (e) {
      _failTripTransition(e, pending: const TripPendingCancel());
    } catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: e.toString()));
    }
  }

  Future<void> finishTrip({double? finishLat, double? finishLng}) async {
    final trip = state.activeTrip;
    if (trip == null || !trip.isOngoing) return;
    emit(
      state.copyWith(tripBusy: true, errorMessage: null, pendingRetry: null),
    );
    try {
      // Billing-поля не отправляем — пересчёт на сервере (sync при FINISHED).
      final body = <String, dynamic>{
        'status': TripStatusCode.finished,
        'finishedAt': DateTime.now().toUtc().toIso8601String(),
        if (finishLat != null) 'finishLat': _round6(finishLat),
        if (finishLng != null) 'finishLng': _round6(finishLng),
      };
      final finished = await withNetworkRetry(
        () => _trips.patch(trip.id, body),
      );
      final prevId = trip.id;
      _lastMetricsUiMsByTrip.remove(prevId);
      emit(
        state.copyWith(
          activeTrip: null,
          tripBoundZone: null,
          liveMetrics: null,
          finishSummary: TripFinishSummary.fromTrip(finished),
          tripBusy: false,
          errorMessage: null,
          pendingRetry: null,
        ),
      );
      _syncSubscription(prevId, null);
    } on DioException catch (e) {
      _failTripTransition(
        e,
        pending: TripPendingFinish(finishLat: finishLat, finishLng: finishLng),
      );
    } catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: e.toString()));
    }
  }

  /// PATCH активной поездки: только status, geo, pause — не billing.
  Future<void> _patchActive(Map<String, dynamic> body) async {
    final trip = state.activeTrip;
    if (trip == null) return;
    emit(
      state.copyWith(tripBusy: true, errorMessage: null, pendingRetry: null),
    );
    try {
      final updated = await withNetworkRetry(() => _trips.patch(trip.id, body));
      emit(
        state.copyWith(
          activeTrip: updated,
          tripBusy: false,
          errorMessage: null,
          pendingRetry: null,
        ),
      );
    } on DioException catch (e) {
      _failTripTransition(e, pending: TripPendingPatch(body));
    } catch (e) {
      emit(state.copyWith(tripBusy: false, errorMessage: e.toString()));
    }
  }

  void _failTripTransition(
    DioException e, {
    TripPendingAction? pending,
    String fallbackKey = 'trip.error.transition_failed',
  }) {
    final retryable = isRetryableDio(e);
    emit(
      state.copyWith(
        tripBusy: false,
        errorMessage: retryable
            ? 'trip.error.network_retry'
            : dioErrorMessage(e, fallbackKey: fallbackKey),
        pendingRetry: retryable ? pending : null,
      ),
    );
  }

  static double? _round6(double? v) {
    if (v == null) return null;
    return double.parse(v.toStringAsFixed(6));
  }

  void clearError() {
    emit(state.copyWith(errorMessage: null));
  }

  void clearPendingRetry() {
    emit(state.copyWith(pendingRetry: null));
  }

  void _syncSubscription(String? previousId, String? nextId) {
    if (previousId != null && previousId != nextId) {
      _realtime.unsubscribeTrip(previousId);
      _lastMetricsUiMsByTrip.remove(previousId);
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
    final tripId = readTripIdFromEnvelope(e) ?? '';
    final activeId = state.activeTrip?.id;
    if (activeId != null && tripId.isNotEmpty && tripId != activeId) {
      return;
    }

    if (eventName == TripWsEvent.tripMetricsUpdated) {
      _handleMetricsUpdated(e, tripId.isNotEmpty ? tripId : activeId);
      return;
    }

    if (eventName == TripWsEvent.tripStateChanged) {
      _handleStateChanged(e, activeId);
      return;
    }

    if (eventName == TripWsEvent.tripFinished) {
      _handleTripFinished(e, activeId);
    }
  }

  void _handleMetricsUpdated(Map<String, dynamic> e, String? tripId) {
    if (tripId == null || tripId.isEmpty) return;

    final now = DateTime.now().millisecondsSinceEpoch;
    final last = _lastMetricsUiMsByTrip[tripId] ?? 0;
    if (now - last < _metricsUiThrottleMs) return;
    _lastMetricsUiMsByTrip[tripId] = now;

    final parsed = parseTripMetricsUpdated(e);
    if (parsed == null) return;

    final merged = (state.liveMetrics ?? const LiveTripMetrics()).mergePatch(
      parsed,
    );
    final trip = state.activeTrip;
    emit(
      state.copyWith(
        liveMetrics: merged,
        activeTrip: trip != null ? trip.applyLiveMetrics(merged) : trip,
      ),
    );
  }

  void _handleStateChanged(Map<String, dynamic> e, String? activeId) {
    final changed = parseTripStateChanged(e);
    if (changed != null && activeId != null && changed.tripId == activeId) {
      final trip = state.activeTrip;
      if (trip != null) {
        emit(state.copyWith(activeTrip: trip.copyWith(status: changed.status)));
      }
    }
    if (activeId != null) {
      unawaited(_reloadTrip(activeId));
    }
  }

  void _handleTripFinished(Map<String, dynamic> e, String? activeId) {
    if (state.finishSummary != null) {
      if (activeId != null) {
        _clearActiveTrip(activeId);
      }
      return;
    }

    final finished = parseTripFinished(e);
    if (finished != null && activeId != null && finished.tripId == activeId) {
      emit(
        state.copyWith(
          finishSummary: TripFinishSummary(
            tripId: finished.tripId,
            finishedAt: finished.finishedAt,
            distanceMeters: finished.distanceMeters,
            chargedMinutes: finished.chargedMinutes,
            chargedKm: finished.chargedKm,
            priceTotal: finished.priceTotal,
          ),
        ),
      );
      _clearActiveTrip(activeId);
      return;
    }

    if (activeId != null) {
      unawaited(_reloadTrip(activeId));
    }
  }

  void _clearActiveTrip(String id) {
    _lastMetricsUiMsByTrip.remove(id);
    emit(state.copyWith(activeTrip: null, liveMetrics: null));
    _syncSubscription(id, null);
  }

  Future<void> _reloadTrip(String id) async {
    try {
      final t = await _trips.getById(id);
      if (!t.isOngoing) {
        if (state.finishSummary == null) {
          emit(state.copyWith(finishSummary: TripFinishSummary.fromTrip(t)));
        }
        _clearActiveTrip(id);
      } else {
        emit(state.copyWith(activeTrip: t));
      }
    } catch (_) {}
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
