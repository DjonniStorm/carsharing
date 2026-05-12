import 'package:dio/dio.dart';

class GeozonesApi {
  GeozonesApi(this._dio);

  final Dio _dio;

  Future<List<dynamic>> boundingBox({
    required double minLon,
    required double minLat,
    required double maxLon,
    required double maxLat,
    String types = 'RENTAL,PARKING',
  }) async {
    final res = await _dio.get<List<dynamic>>(
      '/geozones/bounding-box',
      queryParameters: <String, dynamic>{
        'minLon': minLon,
        'minLat': minLat,
        'maxLon': maxLon,
        'maxLat': maxLat,
        'types': types,
        'includeDeleted': false,
      },
    );
    return res.data ?? <dynamic>[];
  }

  /// `GET /geozones/versions/by-id/:versionId` — геометрия версии по `geoZoneVersionId` поездки.
  Future<Map<String, dynamic>> getVersionById(String versionId) async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/geozones/versions/by-id/${Uri.encodeComponent(versionId)}',
    );
    final m = res.data;
    if (m == null) {
      throw StateError('geozones: empty version body');
    }
    return m;
  }
}
