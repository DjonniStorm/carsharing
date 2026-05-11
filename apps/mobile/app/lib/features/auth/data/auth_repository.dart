import 'package:dio/dio.dart';

import '../domain/auth_result.dart';
import 'auth_api.dart';

class AuthRepository {
  AuthRepository(this._api);

  final AuthApi _api;

  Future<AuthResult> login({
    required String login,
    required String password,
  }) async {
    final data = await _api.login(login: login, password: password);
    final token = (data['access_token'] as String?)?.trim();
    if (token == null || token.isEmpty) {
      throw DioException(
        requestOptions: RequestOptions(path: '/auth/login'),
        message: 'Empty access_token',
      );
    }
    return AuthSuccess(token);
  }

  Future<AuthResult> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final data = await _api.register(
      name: name,
      email: email,
      phone: phone,
      password: password,
    );
    final token = (data['access_token'] as String?)?.trim();
    if (token != null && token.isNotEmpty) {
      return AuthSuccess(token);
    }
    final requires = data['requiresVerification'] == true;
    if (requires) {
      return AuthRequiresVerification(
        email: email,
        message: (data['message'] as String?)?.trim() ?? '',
      );
    }
    throw DioException(
      requestOptions: RequestOptions(path: '/auth/register'),
      message: 'Unexpected register response',
    );
  }

  Future<AuthResult> verifyEmail({
    required String email,
    required String code,
  }) async {
    final data = await _api.verifyEmail(email: email, code: code);
    final token = (data['access_token'] as String?)?.trim();
    if (token == null || token.isEmpty) {
      throw DioException(
        requestOptions: RequestOptions(path: '/auth/verify-email'),
        message: 'Empty access_token',
      );
    }
    return AuthSuccess(token);
  }
}

