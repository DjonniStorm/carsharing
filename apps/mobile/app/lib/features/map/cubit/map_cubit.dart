import 'dart:async';
import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../shared/realtime/trip_realtime_client.dart';
import '../../../shared/realtime/trip_realtime_contract.dart';
import '../data/cars_repository.dart';
import '../domain/car_position.dart';
import 'map_state.dart';

class MapCubit extends Cubit<MapState> {
  MapCubit({
    required CarsRepository carsRepository,
    required TripRealtimeClient realtime,
  })  : _carsRepository = carsRepository,
        _realtime = realtime,
        super(const MapState(cars: {}, loading: false));

  final CarsRepository _carsRepository;
  final TripRealtimeClient _realtime;
  StreamSubscription<Map<String, dynamic>>? _sub;

  Future<void> init() async {
    developer.log('init() start, _sub=${_sub != null}', name: 'MapCubit');
    if (_sub != null) return;
    await _loadCars();

    try {
      await _realtime.connect();
      _realtime.subscribeFleet();
      _sub = _realtime.events.listen(_onRealtimeEvent);
      developer.log('realtime connected + fleet subscribed', name: 'MapCubit');
    } catch (e, st) {
      developer.log(
        'realtime connect/subscribe failed: $e',
        name: 'MapCubit',
        error: e,
        stackTrace: st,
      );
    }
  }

  /// Перезагружает список машин из REST (после старта/завершения поездки,
  /// когда бэкенд мог поменять `isAvailable`).
  Future<void> refresh() async {
    await _loadCars();
  }

  Future<void> _loadCars() async {
    emit(state.copyWith(loading: true));
    try {
      developer.log('listForMap() request', name: 'MapCubit');
      final cars = await _carsRepository.listForMap();
      developer.log(
        'listForMap() ok, count=${cars.length}, withCoords='
        '${cars.where((c) => c.lat != null && c.lon != null).length}',
        name: 'MapCubit',
      );

      // Мердж с уже накопленным state:
      // координаты, что прилетают по WS (trip.route.point / car.location.updated),
      // могут быть свежее, чем lastKnownLat/Lon из БД — не затираем их REST'ом.
      final prevCars = state.cars;
      final merged = <String, CarPosition>{
        for (final fresh in cars)
          fresh.id: _preferLiveCoords(fresh, prevCars[fresh.id]),
      };

      emit(state.copyWith(cars: merged, loading: false));
    } on DioException catch (e, st) {
      developer.log(
        'listForMap() DioException: ${e.message}, status=${e.response?.statusCode}',
        name: 'MapCubit',
        error: e,
        stackTrace: st,
      );
      emit(state.copyWith(loading: false));
    } catch (e, st) {
      developer.log(
        'listForMap() error: $e',
        name: 'MapCubit',
        error: e,
        stackTrace: st,
      );
      emit(state.copyWith(loading: false));
    }
  }

  /// Если в локальном state уже есть live-координаты (из WS), используем их —
  /// REST может вернуть устаревший `lastKnownLat/Lon` (особенно сразу после finish,
  /// когда бэкенд ещё не успел зафиксировать последнюю телеметрию в БД).
  static CarPosition _preferLiveCoords(CarPosition fresh, CarPosition? prev) {
    if (prev == null) return fresh;
    final hasLive = prev.lat != null && prev.lon != null;
    if (!hasLive) return fresh;
    return fresh.copyWith(lat: prev.lat, lon: prev.lon);
  }

  void _onRealtimeEvent(Map<String, dynamic> e) {
    final eventName = e['event']?.toString();
    if (eventName == TripWsEvent.carLocationUpdated ||
        eventName == TripWsEvent.tripRoutePoint) {
      // Driver получает координаты своей машины через trip.route.point
      // (DriverTrip канал), Manager — через car.location.updated (ManagerCar).
      // Payload в обоих случаях содержит {carId, lat, lng[, ...]}.
      _applyCarLocationEvent(e);
      return;
    }
    if (eventName == TripWsEvent.carStateChanged) {
      _applyCarStateEvent(e);
    }
  }

  static Map<String, dynamic> _payloadMap(Map<String, dynamic> e) {
    final p = e['payload'];
    if (p is Map) {
      return p.map((k, v) => MapEntry(k.toString(), v));
    }
    return Map<String, dynamic>.from(e)..remove('event');
  }

  void _applyCarLocationEvent(Map<String, dynamic> e) {
    final data = _payloadMap(e);

    final carId = (data['carId'] as String?) ?? '';
    if (carId.isEmpty) return;
    final latRaw = data['lat'];
    final lonRaw = data['lng'] ?? data['lon'];

    double? toDouble(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '');
    }

    final lat = toDouble(latRaw);
    final lon = toDouble(lonRaw);
    if (lat == null || lon == null) return;

    final prev = state.cars[carId];
    final updated = prev != null
        ? prev.copyWith(lat: lat, lon: lon)
        : CarPosition(
            id: carId,
            isAvailable: true,
            lat: lat,
            lon: lon,
          );

    final next = Map<String, CarPosition>.from(state.cars);
    next[carId] = updated;
    emit(state.copyWith(cars: next));
  }

  void _applyCarStateEvent(Map<String, dynamic> e) {
    final data = _payloadMap(e);
    final carId = (data['carId'] as String?) ?? '';
    if (carId.isEmpty) return;
    final prev = state.cars[carId];
    if (prev == null) return;

    final availRaw = data['isAvailable'];
    final nextAvail = availRaw is bool
        ? availRaw
        : (availRaw?.toString().toLowerCase() == 'true')
            ? true
            : (availRaw?.toString().toLowerCase() == 'false')
                ? false
                : prev.isAvailable;

    final next = Map<String, CarPosition>.from(state.cars);
    next[carId] = prev.copyWith(isAvailable: nextAvail);
    emit(state.copyWith(cars: next));
  }

  @override
  Future<void> close() async {
    await _sub?.cancel();
    _realtime.unsubscribeFleet();
    return super.close();
  }
}

