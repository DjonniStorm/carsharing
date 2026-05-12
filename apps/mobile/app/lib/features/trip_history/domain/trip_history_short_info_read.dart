import '../../trip/domain/trip_read.dart';
import 'car_read.dart';
import 'violation_read.dart';

class TripHistoryShortInfoRead {
  const TripHistoryShortInfoRead({
    required this.trip,
    required this.car,
    required this.violations,
  });

  final TripRead trip;
  final CarRead car;
  final List<ViolationRead> violations;

  static TripHistoryShortInfoRead fromJson(Map<String, dynamic> json) {
    final tripRaw = json['trip'];
    final carRaw = json['car'];
    final violRaw = json['violations'];
    if (tripRaw is! Map || carRaw is! Map) {
      throw FormatException('trip_history: missing trip or car');
    }
    final violations = <ViolationRead>[];
    if (violRaw is List) {
      for (final v in violRaw) {
        if (v is Map) {
          violations.add(
            ViolationRead.fromJson(v.map((k, e) => MapEntry(k.toString(), e))),
          );
        }
      }
    }
    return TripHistoryShortInfoRead(
      trip: TripRead.fromJson(tripRaw.map((k, v) => MapEntry(k.toString(), v))),
      car: CarRead.fromJson(carRaw.map((k, v) => MapEntry(k.toString(), v))),
      violations: violations,
    );
  }
}
