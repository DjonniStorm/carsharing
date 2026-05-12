class ViolationRead {
  const ViolationRead({
    required this.id,
    required this.tripId,
    required this.type,
    required this.description,
    required this.createdAt,
  });

  final String id;
  final String tripId;
  final int type;
  final String description;
  final DateTime createdAt;

  static ViolationRead fromJson(Map<String, dynamic> json) {
    return ViolationRead(
      id: json['id']?.toString() ?? '',
      tripId: json['tripId']?.toString() ?? '',
      type: (json['type'] is num)
          ? (json['type'] as num).toInt()
          : int.tryParse(json['type']?.toString() ?? '') ?? 0,
      description: json['description']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}
