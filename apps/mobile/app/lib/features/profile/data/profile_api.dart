import 'package:dio/dio.dart';

class ProfileApi {
  ProfileApi(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> me() async {
    final res = await _dio.get<Map<String, dynamic>>('/auth/me');
    return res.data ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> patchUser({
    required String id,
    required Map<String, dynamic> data,
  }) async {
    final res = await _dio.patch<Map<String, dynamic>>('/users/$id', data: data);
    return res.data ?? <String, dynamic>{};
  }
}

