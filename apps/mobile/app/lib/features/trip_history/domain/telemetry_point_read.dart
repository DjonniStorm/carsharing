class TelemetryPointRead {
  const TelemetryPointRead({
    required this.id,
    required this.tripId,
    required this.timestamp,
    required this.lat,
    required this.lon,
    required this.speed,
    required this.acceleration,
    required this.fuelLevel,
  });

  final String id;
  final String tripId;
  final DateTime timestamp;
  final double lat;
  final double lon;
  final double speed;
  final double acceleration;
  final double fuelLevel;

  static TelemetryPointRead fromJson(Map<String, dynamic> json) {
    double toD(Object? v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '') ?? 0;
    }

    return TelemetryPointRead(
      id: json['id']?.toString() ?? '',
      tripId: json['tripId']?.toString() ?? '',
      timestamp: DateTime.tryParse(json['timestamp']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      lat: toD(json['lat']),
      lon: toD(json['lon']),
      speed: toD(json['speed']),
      acceleration: toD(json['acceleration']),
      fuelLevel: toD(json['fuelLevel']),
    );
  }
}
