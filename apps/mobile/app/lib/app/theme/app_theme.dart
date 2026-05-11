import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorSchemeSeed: const Color(0xFF7C3AED),
    );
    return base.copyWith(
      scaffoldBackgroundColor: base.colorScheme.surface,
    );
  }

  static ThemeData dark() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorSchemeSeed: const Color(0xFF7C3AED),
    );
    return base.copyWith(
      scaffoldBackgroundColor: const Color(0xFF0B0F16),
    );
  }
}

