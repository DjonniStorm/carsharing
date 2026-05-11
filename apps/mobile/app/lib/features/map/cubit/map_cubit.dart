import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../shared/realtime/trip_realtime_client.dart';
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
    if (_sub != null) return;
    emit(state.copyWith(loading: true));
    try {
      final cars = await _carsRepository.listAvailableWithPosition();
      emit(
        state.copyWith(
          cars: {for (final c in cars) c.id: c},
          loading: false,
        ),
      );
    } on DioException {
      emit(state.copyWith(loading: false));
    }

    await _realtime.connect();
    _sub = _realtime.events.listen(_onRealtimeEvent);
  }

  void _onRealtimeEvent(Map<String, dynamic> e) {
    final eventName = e['event']?.toString();
    if (eventName != 'car.location.updated') return;
    final data = e['payload'] is Map ? (e['payload'] as Map) : e;

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

    final updated = CarPosition(
      id: carId,
      isAvailable: true,
      lat: lat,
      lon: lon,
    );

    final next = Map<String, CarPosition>.from(state.cars);
    next[carId] = updated;
    emit(state.copyWith(cars: next));
  }

  @override
  Future<void> close() async {
    await _sub?.cancel();
    await _realtime.disconnect();
    return super.close();
  }
}

