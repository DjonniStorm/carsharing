import 'package:dio/dio.dart';

class CarsApi {
  CarsApi(this._dio);

  final Dio _dio;

  Future<List<dynamic>> listCars() async {
    final res = await _dio.get<List<dynamic>>('/cars');
    return res.data ?? <dynamic>[];
  }
}

