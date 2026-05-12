class CarRead {
  const CarRead({
    required this.id,
    required this.brand,
    required this.model,
    required this.licensePlate,
    required this.color,
    required this.mileage,
    required this.fuelLevel,
    required this.isAvailable,
    required this.carStatus,
    required this.isDeleted,
    this.createdAt,
    this.updatedAt,
    this.lastKnownLat,
    this.lastKnownLon,
    this.lastPositionAt,
  });

  final String id;
  final String brand;
  final String model;
  final String licensePlate;
  final String color;
  final double mileage;
  final double fuelLevel;
  final bool isAvailable;
  final int carStatus;
  final bool isDeleted;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final double? lastKnownLat;
  final double? lastKnownLon;
  final DateTime? lastPositionAt;

  static CarRead fromJson(Map<String, dynamic> json) {
    DateTime? parseDt(Object? v) {
      if (v == null) return null;
      return DateTime.tryParse(v.toString());
    }

    double toD(Object? v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '') ?? 0;
    }

    bool toBool(Object? v) {
      if (v is bool) return v;
      if (v is num) return v != 0;
      final s = v?.toString().toLowerCase();
      return s == 'true' || s == '1';
    }

    return CarRead(
      id: json['id']?.toString() ?? '',
      brand: json['brand']?.toString() ?? '',
      model: json['model']?.toString() ?? '',
      licensePlate: json['licensePlate']?.toString() ?? '',
      color: json['color']?.toString() ?? '',
      mileage: toD(json['mileage']),
      fuelLevel: toD(json['fuelLevel']),
      isAvailable: toBool(json['isAvailable']),
      carStatus: (json['carStatus'] is num)
          ? (json['carStatus'] as num).toInt()
          : int.tryParse(json['carStatus']?.toString() ?? '') ?? 0,
      isDeleted: toBool(json['isDeleted']),
      createdAt: parseDt(json['createdAt']),
      updatedAt: parseDt(json['updatedAt']),
      lastKnownLat: json['lastKnownLat'] != null ? toD(json['lastKnownLat']) : null,
      lastKnownLon: json['lastKnownLon'] != null ? toD(json['lastKnownLon']) : null,
      lastPositionAt: parseDt(json['lastPositionAt']),
    );
  }
}
