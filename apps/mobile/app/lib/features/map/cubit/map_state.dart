import 'package:equatable/equatable.dart';

import '../domain/car_position.dart';

class MapState extends Equatable {
  const MapState({
    required this.cars,
    required this.loading,
  });

  final Map<String, CarPosition> cars;
  final bool loading;

  MapState copyWith({
    Map<String, CarPosition>? cars,
    bool? loading,
  }) {
    return MapState(
      cars: cars ?? this.cars,
      loading: loading ?? this.loading,
    );
  }

  @override
  List<Object?> get props => [cars.length, loading];
}

