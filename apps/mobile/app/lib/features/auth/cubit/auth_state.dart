import 'package:equatable/equatable.dart';

sealed class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthUnauthorized extends AuthState {
  const AuthUnauthorized();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthorized extends AuthState {
  const AuthAuthorized(this.accessToken);
  final String accessToken;

  @override
  List<Object?> get props => [accessToken];
}

class AuthError extends AuthState {
  const AuthError(this.message);
  final String message;

  @override
  List<Object?> get props => [message];
}

