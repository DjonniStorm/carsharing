class AppRoutes {
  static const login = '/login';
  static const register = '/register';
  static const verifyEmail = '/verify-email';
  static const map = '/map';
  static const profile = '/profile';
  static const support = '/support';
  static const settings = '/settings';
  static const trips = '/trips';

  static String tripHistoryDetail(String tripId) => '$trips/$tripId';
}

