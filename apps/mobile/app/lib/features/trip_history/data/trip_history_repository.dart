import '../domain/trip_history_full_read.dart';
import '../domain/trip_history_short_info_read.dart';
import 'trip_history_api.dart';

class TripHistoryRepository {
  TripHistoryRepository(this._api);

  final TripHistoryApi _api;

  Future<List<TripHistoryShortInfoRead>> listShort(TripHistoryListQuery query) =>
      _api.listShort(query);

  Future<TripHistoryShortInfoRead> getShort(String tripId) =>
      _api.getShort(tripId);

  Future<TripHistoryFullRead> getFull(String tripId) => _api.getFull(tripId);
}
