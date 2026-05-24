class AppConfig {
  /// Для Android-эмулятора: http://10.0.2.2:3000
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    // defaultValue: 'http://46.253.132.51:3000',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Socket.IO endpoint (тот же хост, что и API по умолчанию).
  static const socketBaseUrl = String.fromEnvironment(
    'SOCKET_BASE_URL',
    defaultValue: apiBaseUrl,
  );

  static const supportPhone = '+7 (495) 728-14-36';
  static const supportEmail = 'help@carsharing-demo.ru';
}
