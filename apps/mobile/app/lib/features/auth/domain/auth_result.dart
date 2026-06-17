sealed class AuthResult {
  const AuthResult();
}

class AuthSuccess extends AuthResult {
  const AuthSuccess(this.accessToken);
  final String accessToken;
}

class AuthRequiresVerification extends AuthResult {
  const AuthRequiresVerification({
    required this.email,
    required this.phone,
    required this.message,
  });

  final String email;
  final String phone;
  final String message;
}
