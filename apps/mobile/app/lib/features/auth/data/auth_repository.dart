import 'package:dio/dio.dart';

import '../domain/auth_result.dart';
import '../domain/verification_channel.dart';
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
    if (token != null && token.isNotEmpty) {
      return AuthSuccess(token);
    }
    if (data['requiresVerification'] == true) {
      return AuthRequiresVerification(
        email: (data['email'] as String?)?.trim() ?? '',
        phone: (data['phone'] as String?)?.trim() ?? '',
        message: (data['message'] as String?)?.trim() ?? '',
      );
    }
    throw DioException(
      requestOptions: RequestOptions(path: '/auth/login'),
      message: 'Unexpected login response',
    );
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
    if (data['requiresVerification'] == true) {
      return AuthRequiresVerification(
        email: (data['email'] as String?)?.trim() ?? email,
        phone: (data['phone'] as String?)?.trim() ?? phone,
        message: (data['message'] as String?)?.trim() ?? '',
      );
    }
    throw DioException(
      requestOptions: RequestOptions(path: '/auth/register'),
      message: 'Unexpected register response',
    );
  }

  Future<String> fetchFirebaseRecaptchaSiteKey() async {
    final data = await _api.getFirebaseRecaptchaParams();
    final siteKey = (data['recaptchaSiteKey'] as String?)?.trim();
    if (siteKey == null || siteKey.isEmpty) {
      throw DioException(
        requestOptions: RequestOptions(path: '/auth/firebase-recaptcha-params'),
        message: 'Empty recaptchaSiteKey',
      );
    }
    return siteKey;
  }

  Future<SendVerificationCodeResult> sendVerificationCode({
    required String email,
    required VerificationChannel channel,
    String? recaptchaToken,
  }) async {
    final data = await _api.sendVerificationCode(
      email: email,
      channel: channel.apiValue,
      recaptchaToken: recaptchaToken,
    );
    final sentChannel = VerificationChannel.fromApiValue(
      (data['channel'] as String?)?.trim(),
    );
    if (sentChannel == null) {
      throw DioException(
        requestOptions: RequestOptions(path: '/auth/send-verification-code'),
        message: 'Unexpected send-verification-code response',
      );
    }
    return SendVerificationCodeResult(
      channel: sentChannel,
      message: (data['message'] as String?)?.trim() ?? '',
    );
  }

  Future<AuthResult> verifyAccount({
    required String email,
    required String code,
  }) async {
    final data = await _api.verifyAccount(email: email, code: code);
    final token = (data['access_token'] as String?)?.trim();
    if (token == null || token.isEmpty) {
      throw DioException(
        requestOptions: RequestOptions(path: '/auth/verify-account'),
        message: 'Empty access_token',
      );
    }
    return AuthSuccess(token);
  }
}
