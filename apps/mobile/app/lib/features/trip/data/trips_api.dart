import 'package:dio/dio.dart';

class TripsApi {
  TripsApi(this._dio);

  final Dio _dio;

  Future<List<dynamic>> list({int? status}) async {
    final qp = <String, dynamic>{};
    if (status != null) {
      qp['status'] = status;
    }
    final res = await _dio.get<List<dynamic>>(
      '/trips',
      queryParameters: qp.isEmpty ? null : qp,
    );
    return res.data ?? <dynamic>[];
  }

  Future<Map<String, dynamic>> getById(String id) async {
    final res = await _dio.get<Map<String, dynamic>>('/trips/$id');
    return Map<String, dynamic>.from(res.data ?? {});
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async {
    final res = await _dio.post<Map<String, dynamic>>('/trips', data: body);
    return Map<String, dynamic>.from(res.data ?? {});
  }

  Future<Map<String, dynamic>> patch(String id, Map<String, dynamic> body) async {
    final res = await _dio.patch<Map<String, dynamic>>('/trips/$id', data: body);
    return Map<String, dynamic>.from(res.data ?? {});
  }
}
