class AppConfig {
  /// Для Android-эмулятора: http://10.0.2.2:3000
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Socket.IO endpoint (тот же хост, что и API по умолчанию).
  static const socketBaseUrl = String.fromEnvironment(
    'SOCKET_BASE_URL',
    defaultValue: apiBaseUrl,
  );
}

