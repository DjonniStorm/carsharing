import '../domain/car_position.dart';

class MapState {
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
}

