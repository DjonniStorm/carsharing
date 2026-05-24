import 'package:dio/dio.dart';

class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> login({
    required String login,
    required String password,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'login': login, 'password': password},
    );
    return (res.data ?? <String, dynamic>{});
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/register',
      data: {
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
      },
    );
    return (res.data ?? <String, dynamic>{});
  }

  Future<Map<String, dynamic>> getFirebaseRecaptchaParams() async {
    final res = await _dio.get<Map<String, dynamic>>(
      '/auth/firebase-recaptcha-params',
    );
    return (res.data ?? <String, dynamic>{});
  }

  Future<Map<String, dynamic>> sendVerificationCode({
    required String email,
    required String channel,
    String? recaptchaToken,
  }) async {
    final data = <String, dynamic>{
      'email': email,
      'channel': channel,
    };
    if (recaptchaToken != null) {
      data['recaptchaToken'] = recaptchaToken;
    }
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/send-verification-code',
      data: data,
    );
    return (res.data ?? <String, dynamic>{});
  }

  Future<Map<String, dynamic>> verifyAccount({
    required String email,
    required String code,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/verify-account',
      data: {'email': email, 'code': code},
    );
    return (res.data ?? <String, dynamic>{});
  }
}
