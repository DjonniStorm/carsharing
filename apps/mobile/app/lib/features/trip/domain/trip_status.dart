/// Совпадает с `TripStatus` на бэкенде (числовой enum).
abstract final class TripStatusCode {
  static const int pending = 0;
  static const int started = 1;
  static const int active = 2;
  static const int paused = 3;
  static const int finished = 4;
  static const int cancelled = 5;
  static const int error = 6;
  static const int unknown = 7;
}
