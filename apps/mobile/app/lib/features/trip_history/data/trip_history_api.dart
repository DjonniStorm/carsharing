import 'package:dio/dio.dart';

import '../domain/trip_history_full_read.dart';
import '../domain/trip_history_short_info_read.dart';

class TripHistoryListQuery {
  const TripHistoryListQuery({
    this.userId,
    this.limit,
    this.offset,
    this.startedAfter,
    this.startedBefore,
    this.finishedAfter,
    this.finishedBefore,
  });

  final String? userId;
  final int? limit;
  final int? offset;
  final String? startedAfter;
  final String? startedBefore;
  final String? finishedAfter;
  final String? finishedBefore;

  Map<String, dynamic> toQueryParameters() {
    final m = <String, dynamic>{};
    void put(String k, Object? v) {
      if (v == null) return;
      if (v is String && v.isEmpty) return;
      m[k] = v;
    }

    put('userId', userId);
    if (limit != null) put('limit', limit);
    if (offset != null) put('offset', offset);
    put('startedAfter', startedAfter);
    put('startedBefore', startedBefore);
    put('finishedAfter', finishedAfter);
    put('finishedBefore', finishedBefore);
    return m;
  }
}

class TripHistoryApi {
  TripHistoryApi(this._dio);

  final Dio _dio;

  Future<List<TripHistoryShortInfoRead>> listShort(
    TripHistoryListQuery query,
  ) async {
    final res = await _dio.get<List<dynamic>>(
      '/trip-history',
      queryParameters: query.toQueryParameters(),
    );
    final data = res.data ?? <dynamic>[];
    return data
        .whereType<Map>()
        .map((e) => TripHistoryShortInfoRead.fromJson(
              e.map((k, v) => MapEntry(k.toString(), v)),
            ))
        .toList(growable: false);
  }

  Future<TripHistoryShortInfoRead> getShort(String tripId) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/trip-history/${Uri.encodeComponent(tripId)}',
    );
    final m = res.data;
    if (m == null) {
      throw StateError('trip-history: empty body');
    }
    return TripHistoryShortInfoRead.fromJson(m);
  }

  Future<TripHistoryFullRead> getFull(String tripId) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/trip-history/${Uri.encodeComponent(tripId)}/full',
    );
    final m = res.data;
    if (m == null) {
      throw StateError('trip-history/full: empty body');
    }
    return TripHistoryFullRead.fromJson(m);
  }
}
