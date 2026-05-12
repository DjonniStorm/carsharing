import 'trip_status.dart';

class TripRead {
  const TripRead({
    required this.id,
    required this.userId,
    required this.carId,
    required this.geoZoneVersionId,
    required this.status,
    required this.startedAt,
    required this.distance,
    required this.duration,
    this.finishedAt,
    this.pauseStartedAt,
    this.totalPausedSec = 0,
    this.startLat,
    this.startLng,
    this.finishLat,
    this.finishLng,
    this.distanceMeters,
    this.chargedMinutes,
    this.chargedKm,
    this.priceTime,
    this.priceDistance,
    this.pricePause,
    this.priceTotal,
    this.createdAt,
    this.updatedAt,
    this.carPlateSnapshot,
    this.carDisplayNameSnapshot,
  });

  final String id;
  final String userId;
  final String carId;
  final String geoZoneVersionId;
  final int status;

  final DateTime startedAt;
  final DateTime? finishedAt;
  final DateTime? pauseStartedAt;
  final int totalPausedSec;

  final double? startLat;
  final double? startLng;
  final double? finishLat;
  final double? finishLng;

  final double distance;
  final double duration;
  final double? distanceMeters;

  final double? chargedMinutes;
  final double? chargedKm;

  final double? priceTime;
  final double? priceDistance;
  final double? pricePause;
  final double? priceTotal;

  final DateTime? createdAt;
  final DateTime? updatedAt;

  final String? carPlateSnapshot;
  final String? carDisplayNameSnapshot;

  bool get isOngoing =>
      status == TripStatusCode.pending ||
      status == TripStatusCode.started ||
      status == TripStatusCode.active ||
      status == TripStatusCode.paused;

  static TripRead fromJson(Map<String, dynamic> json) {
    DateTime? parseDt(Object? v) {
      if (v == null) return null;
      if (v is DateTime) return v;
      return DateTime.tryParse(v.toString());
    }

    double? toD(Object? v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '');
    }

    return TripRead(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      carId: json['carId']?.toString() ?? '',
      geoZoneVersionId: json['geoZoneVersionId']?.toString() ?? '',
      status: (json['status'] is num)
          ? (json['status'] as num).toInt()
          : int.tryParse(json['status']?.toString() ?? '') ?? TripStatusCode.unknown,
      startedAt: parseDt(json['startedAt']) ?? DateTime.fromMillisecondsSinceEpoch(0),
      finishedAt: parseDt(json['finishedAt']),
      pauseStartedAt: parseDt(json['pauseStartedAt']),
      totalPausedSec:
          (json['totalPausedSec'] is num) ? (json['totalPausedSec'] as num).toInt() : 0,
      startLat: toD(json['startLat']),
      startLng: toD(json['startLng']),
      finishLat: toD(json['finishLat']),
      finishLng: toD(json['finishLng']),
      distance: toD(json['distance']) ?? 0,
      duration: toD(json['duration']) ?? 0,
      distanceMeters: toD(json['distanceMeters']),
      chargedMinutes: toD(json['chargedMinutes']),
      chargedKm: toD(json['chargedKm']),
      priceTime: toD(json['priceTime']),
      priceDistance: toD(json['priceDistance']),
      pricePause: toD(json['pricePause']),
      priceTotal: toD(json['priceTotal']),
      createdAt: parseDt(json['createdAt']),
      updatedAt: parseDt(json['updatedAt']),
      carPlateSnapshot: json['carPlateSnapshot']?.toString(),
      carDisplayNameSnapshot: json['carDisplayNameSnapshot']?.toString(),
    );
  }
}
