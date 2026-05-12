class CarPosition {
  const CarPosition({
    required this.id,
    required this.isAvailable,
    required this.lat,
    required this.lon,
    this.isDeleted = false,
    this.licensePlate,
    this.brand,
    this.model,
    this.color,
    this.mileage,
    this.fuelLevel,
    this.carStatus,
  });

  final String id;
  final bool isAvailable;
  final double? lat;
  final double? lon;

  /// Скрыть с карты (как на вебе `findAll` без удалённых).
  final bool isDeleted;

  final String? licensePlate;
  final String? brand;
  final String? model;

  /// Доп. характеристики из CarRead (для превью перед стартом поездки).
  final String? color;
  final double? mileage;
  final double? fuelLevel;
  final int? carStatus;

  String get displayName {
    final b = brand?.trim() ?? '';
    final m = model?.trim() ?? '';
    if (b.isNotEmpty && m.isNotEmpty) {
      return '$b $m';
    }
    if (b.isNotEmpty) return b;
    if (m.isNotEmpty) return m;
    return '';
  }

  static CarPosition fromJson(Map<String, dynamic> json) {
    double? toDouble(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '');
    }

    int? toInt(dynamic v) {
      if (v is int) return v;
      if (v is num) return v.toInt();
      return int.tryParse(v?.toString() ?? '');
    }

    return CarPosition(
      id: (json['id'] as String?) ?? '',
      isAvailable: (json['isAvailable'] as bool?) ?? false,
      lat: toDouble(json['lastKnownLat']),
      lon: toDouble(json['lastKnownLon']),
      isDeleted: json['isDeleted'] == true,
      licensePlate: json['licensePlate']?.toString(),
      brand: json['brand']?.toString(),
      model: json['model']?.toString(),
      color: json['color']?.toString(),
      mileage: toDouble(json['mileage']),
      fuelLevel: toDouble(json['fuelLevel']),
      carStatus: toInt(json['carStatus']),
    );
  }

  CarPosition copyWith({
    double? lat,
    double? lon,
    bool? isAvailable,
    bool? isDeleted,
    String? licensePlate,
    String? brand,
    String? model,
    String? color,
    double? mileage,
    double? fuelLevel,
    int? carStatus,
  }) {
    return CarPosition(
      id: id,
      isAvailable: isAvailable ?? this.isAvailable,
      lat: lat ?? this.lat,
      lon: lon ?? this.lon,
      isDeleted: isDeleted ?? this.isDeleted,
      licensePlate: licensePlate ?? this.licensePlate,
      brand: brand ?? this.brand,
      model: model ?? this.model,
      color: color ?? this.color,
      mileage: mileage ?? this.mileage,
      fuelLevel: fuelLevel ?? this.fuelLevel,
      carStatus: carStatus ?? this.carStatus,
    );
  }
}

