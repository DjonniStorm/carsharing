import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../shared/api/dio_error_message.dart';
import '../../../shared/storage/secure_token_storage.dart';
import '../data/auth_repository.dart';
import '../domain/auth_result.dart';
import 'auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  AuthCubit({
    required AuthRepository repository,
    required SecureTokenStorage tokenStorage,
  })  : _repository = repository,
        _tokenStorage = tokenStorage,
        super(const AuthUnauthorized()) {
    _tokenSub = _tokenStorage.changes.listen((_) {
      unawaited(restoreSession());
    });
  }

  final AuthRepository _repository;
  final SecureTokenStorage _tokenStorage;
  StreamSubscription<void>? _tokenSub;

  Future<void> restoreSession() async {
    final token = await _tokenStorage.readAccessToken();
    if (token != null && token.isNotEmpty) {
      emit(AuthAuthorized(token));
    } else {
      emit(const AuthUnauthorized());
    }
  }

  Future<void> login({
    required String login,
    required String password,
  }) async {
    emit(const AuthLoading());
    try {
      final res = await _repository.login(login: login, password: password);
      final token = (res as AuthSuccess).accessToken;
      await _tokenStorage.writeAccessToken(token);
      emit(AuthAuthorized(token));
    } on DioException catch (e) {
      emit(AuthError(dioErrorMessage(e)));
      emit(const AuthUnauthorized());
    } catch (e) {
      emit(AuthError(e.toString()));
      emit(const AuthUnauthorized());
    }
  }

  Future<AuthResult?> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    emit(const AuthLoading());
    try {
      final res = await _repository.register(
        name: name,
        email: email,
        phone: phone,
        password: password,
      );
      if (res is AuthSuccess) {
        await _tokenStorage.writeAccessToken(res.accessToken);
        emit(AuthAuthorized(res.accessToken));
      } else {
        emit(const AuthUnauthorized());
      }
      return res;
    } on DioException catch (e) {
      emit(AuthError(dioErrorMessage(e)));
      emit(const AuthUnauthorized());
      return null;
    }
  }

  Future<void> verifyEmail({
    required String email,
    required String code,
  }) async {
    emit(const AuthLoading());
    try {
      final res = await _repository.verifyEmail(email: email, code: code);
      final token = (res as AuthSuccess).accessToken;
      await _tokenStorage.writeAccessToken(token);
      emit(AuthAuthorized(token));
    } on DioException catch (e) {
      emit(AuthError(dioErrorMessage(e)));
      emit(const AuthUnauthorized());
    } catch (e) {
      emit(AuthError(e.toString()));
      emit(const AuthUnauthorized());
    }
  }

  Future<void> logout() async {
    await _tokenStorage.clear();
    emit(const AuthUnauthorized());
  }

  @override
  Future<void> close() async {
    await _tokenSub?.cancel();
    return super.close();
  }
}
