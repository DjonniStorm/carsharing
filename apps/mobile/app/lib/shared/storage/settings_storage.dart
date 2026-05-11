import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsStorage {
  SettingsStorage(this._prefs);

  final SharedPreferences _prefs;

  static const _kThemeMode = 'settings.theme_mode';
  static const _kLocale = 'settings.locale';

  ThemeMode readThemeMode() {
    final v = _prefs.getString(_kThemeMode);
    return switch (v) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.dark,
    };
  }

  Future<void> writeThemeMode(ThemeMode mode) async {
    final v = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    };
    await _prefs.setString(_kThemeMode, v);
  }

  Locale? readLocale() {
    final tag = _prefs.getString(_kLocale);
    if (tag == null || tag.isEmpty) return null;
    final parts = tag.split('-');
    return parts.length == 1 ? Locale(parts[0]) : Locale(parts[0], parts[1]);
  }

  Future<void> writeLocale(Locale? locale) async {
    if (locale == null) {
      await _prefs.remove(_kLocale);
      return;
    }
    final tag = locale.countryCode == null || locale.countryCode!.isEmpty
        ? locale.languageCode
        : '${locale.languageCode}-${locale.countryCode}';
    await _prefs.setString(_kLocale, tag);
  }
}

