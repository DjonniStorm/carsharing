import '../domain/car_position.dart';
import 'cars_api.dart';

class CarsRepository {
  CarsRepository(this._api);

  final CarsApi _api;

  Future<List<CarPosition>> listAvailableWithPosition() async {
    final raw = await _api.listCars();
    final cars = raw
        .whereType<Map>()
        .map((m) => m.map((k, v) => MapEntry(k.toString(), v)))
        .map(CarPosition.fromJson)
        .where((c) => c.isAvailable && c.lat != null && c.lon != null)
        .toList(growable: false);
    return cars;
  }
}

