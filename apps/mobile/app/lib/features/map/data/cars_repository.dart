import '../domain/car_position.dart';
import 'cars_api.dart';

class CarsRepository {
  CarsRepository(this._api);

  final CarsApi _api;

  /// Все неудалённые машины из REST, в т.ч. без `lastKnownLat/Lon` — координаты могут прийти по WS (как на вебе).
  Future<List<CarPosition>> listForMap() async {
    final raw = await _api.listCars();
    return raw
        .whereType<Map>()
        .map((m) => Map<String, dynamic>.from(m.map((k, v) => MapEntry(k.toString(), v))))
        .map(CarPosition.fromJson)
        .where((c) => c.id.isNotEmpty && !c.isDeleted)
        .toList(growable: false);
  }
}

