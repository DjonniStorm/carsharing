class ProfileUser {
  const ProfileUser({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
  });

  final String id;
  final String name;
  final String email;
  final String phone;

  /// На бэке `UserRole` — числовой enum, поэтому держим как dynamic-источник
  /// и не трогаем тип. UI пока роль не использует.
  final Object? role;

  static ProfileUser fromJson(Map<String, dynamic> json) {
    return ProfileUser(
      id: _asString(json['id']),
      name: _asString(json['name']),
      email: _asString(json['email']),
      phone: _asString(json['phone']),
      role: json['role'],
    );
  }

  static String _asString(Object? v) {
    if (v == null) return '';
    if (v is String) return v;
    return v.toString();
  }
}

