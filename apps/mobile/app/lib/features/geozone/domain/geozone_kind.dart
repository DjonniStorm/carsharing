/// Совпадает с `GeozoneType` на бэкенде.
enum GeozoneKind {
  rental,
  parking,
  other;

  static GeozoneKind parse(Object? raw) {
    final s = raw?.toString().toUpperCase().trim() ?? '';
    return switch (s) {
      'RENTAL' => GeozoneKind.rental,
      'PARKING' => GeozoneKind.parking,
      _ => GeozoneKind.other,
    };
  }

  bool get isRental => this == GeozoneKind.rental;
}
