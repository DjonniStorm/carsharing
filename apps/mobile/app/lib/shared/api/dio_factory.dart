import 'dart:developer' as developer;

import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/secure_token_storage.dart';

class DioFactory {
  DioFactory(this._tokenStorage, {Future<void> Function()? onUnauthorized})
    : _onUnauthorized = onUnauthorized;

  final SecureTokenStorage _tokenStorage;
  final Future<void> Function()? _onUnauthorized;

  /// Публичные эндпоинты: 401 здесь не означает «протухшая сессия».
  static bool _isPublicAuthPath(String path) {
    const paths = ['/auth/login', '/auth/register', '/auth/verify-email'];
    for (final p in paths) {
      if (path == p || path.endsWith(p)) return true;
    }
    return false;
  }

  static bool _requestHadBearer(RequestOptions o) {
    final raw = o.headers['Authorization'];
    if (raw == null) return false;
    final s = raw.toString().trim();
    const prefix = 'Bearer ';
    return s.length > prefix.length &&
        s.toLowerCase().startsWith(prefix.toLowerCase());
  }

  Dio create() {
    final dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 60),
        sendTimeout: const Duration(seconds: 60),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStorage.readAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          developer.log('${options.method} ${options.uri}', name: 'Dio');
          handler.next(options);
        },
        onError: (e, handler) async {
          developer.log(
            'ERROR ${e.requestOptions.method} ${e.requestOptions.uri} '
            '→ status=${e.response?.statusCode}, type=${e.type}, msg=${e.message}',
            name: 'Dio',
            error: e,
          );

          final status = e.response?.statusCode;
          final path = e.requestOptions.uri.path;
          if (status == 401 &&
              !_isPublicAuthPath(path) &&
              _requestHadBearer(e.requestOptions)) {
            await _tokenStorage.clear();
            final hook = _onUnauthorized;
            if (hook != null) {
              try {
                await hook();
              } catch (err, st) {
                developer.log(
                  'onUnauthorized failed: $err',
                  name: 'Dio',
                  error: err,
                  stackTrace: st,
                );
              }
            }
          }

          handler.next(e);
        },
        onResponse: (response, handler) {
          developer.log(
            '${response.statusCode} ${response.requestOptions.method} '
            '${response.requestOptions.uri}',
            name: 'Dio',
          );
          handler.next(response);
        },
      ),
    );

    return dio;
  }
}
