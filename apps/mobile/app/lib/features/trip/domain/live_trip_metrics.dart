import 'trip_read.dart';

/// Live-биллинг с WS (`trip.metrics.updated`) или REST.
class LiveTripMetrics {
  const LiveTripMetrics({
    this.distanceMeters,
    this.chargedMinutes,
    this.chargedKm,
    this.priceTime,
    this.priceDistance,
    this.pricePause,
    this.priceTotal,
    this.updatedAt,
  });

  final double? distanceMeters;
  final double? chargedMinutes;
  final double? chargedKm;
  final double? priceTime;
  final double? priceDistance;
  final double? pricePause;
  final double? priceTotal;
  final DateTime? updatedAt;

  LiveTripMetrics mergePatch(LiveTripMetrics patch) {
    return LiveTripMetrics(
      distanceMeters: patch.distanceMeters ?? distanceMeters,
      chargedMinutes: patch.chargedMinutes ?? chargedMinutes,
      chargedKm: patch.chargedKm ?? chargedKm,
      priceTime: patch.priceTime ?? priceTime,
      priceDistance: patch.priceDistance ?? priceDistance,
      pricePause: patch.pricePause ?? pricePause,
      priceTotal: patch.priceTotal ?? priceTotal,
      updatedAt: patch.updatedAt ?? updatedAt,
    );
  }

  /// WS/live перекрывает непустые поля; остальное — из [trip].
  static LiveTripMetrics merge(LiveTripMetrics? live, TripRead trip) {
    final base = live ??
        LiveTripMetrics(
          distanceMeters: trip.distanceMeters,
          chargedMinutes: trip.chargedMinutes,
          chargedKm: trip.chargedKm,
          priceTime: trip.priceTime,
          priceDistance: trip.priceDistance,
          pricePause: trip.pricePause,
          priceTotal: trip.priceTotal,
        );
    return LiveTripMetrics(
      distanceMeters: base.distanceMeters ?? trip.distanceMeters,
      chargedMinutes: base.chargedMinutes ?? trip.chargedMinutes,
      chargedKm: base.chargedKm ?? trip.chargedKm,
      priceTime: base.priceTime ?? trip.priceTime,
      priceDistance: base.priceDistance ?? trip.priceDistance,
      pricePause: base.pricePause ?? trip.pricePause,
      priceTotal: base.priceTotal ?? trip.priceTotal,
      updatedAt: base.updatedAt,
    );
  }

  double? get distanceKm {
    final m = distanceMeters;
    if (m != null) return m / 1000;
    return null;
  }
}

/// Итог после завершения поездки (PATCH или `trip.finished`).
class TripFinishSummary {
  const TripFinishSummary({
    required this.tripId,
    required this.finishedAt,
    this.distanceMeters,
    this.chargedMinutes,
    this.chargedKm,
    this.priceTotal,
  });

  final String tripId;
  final DateTime finishedAt;
  final double? distanceMeters;
  final double? chargedMinutes;
  final double? chargedKm;
  final double? priceTotal;

  double? get distanceKm {
    final m = distanceMeters;
    if (m != null) return m / 1000;
    return null;
  }

  factory TripFinishSummary.fromTrip(TripRead trip) {
    return TripFinishSummary(
      tripId: trip.id,
      finishedAt: trip.finishedAt ?? DateTime.now().toUtc(),
      distanceMeters: trip.distanceMeters,
      chargedMinutes: trip.chargedMinutes,
      chargedKm: trip.chargedKm,
      priceTotal: trip.priceTotal,
    );
  }
}
