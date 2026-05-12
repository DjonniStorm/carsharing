import '../../trip/domain/trip_read.dart';
import 'car_read.dart';
import 'telemetry_point_read.dart';
import 'trip_history_short_info_read.dart';
import 'violation_read.dart';

class TripHistoryFullRead {
  const TripHistoryFullRead({
    required this.trip,
    required this.car,
    required this.violations,
    required this.points,
  });

  final TripRead trip;
  final CarRead car;
  final List<ViolationRead> violations;
  final List<TelemetryPointRead> points;

  static TripHistoryFullRead fromJson(Map<String, dynamic> json) {
    final short = TripHistoryShortInfoRead.fromJson(json);
    final ptsRaw = json['points'];
    final points = <TelemetryPointRead>[];
    if (ptsRaw is List) {
      for (final p in ptsRaw) {
        if (p is Map) {
          points.add(
            TelemetryPointRead.fromJson(p.map((k, v) => MapEntry(k.toString(), v))),
          );
        }
      }
    }
    points.sort((a, b) => a.timestamp.compareTo(b.timestamp));
    return TripHistoryFullRead(
      trip: short.trip,
      car: short.car,
      violations: short.violations,
      points: points,
    );
  }
}
