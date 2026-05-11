class CarPosition {
  const CarPosition({
    required this.id,
    required this.isAvailable,
    required this.lat,
    required this.lon,
  });

  final String id;
  final bool isAvailable;
  final double? lat;
  final double? lon;

  static CarPosition fromJson(Map<String, dynamic> json) {
    double? toDouble(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '');
    }

    return CarPosition(
      id: (json['id'] as String?) ?? '',
      isAvailable: (json['isAvailable'] as bool?) ?? false,
      lat: toDouble(json['lastKnownLat']),
      lon: toDouble(json['lastKnownLon']),
    );
  }
}

