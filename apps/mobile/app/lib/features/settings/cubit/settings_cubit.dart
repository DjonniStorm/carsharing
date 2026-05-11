import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../shared/storage/settings_storage.dart';
import 'settings_state.dart';

class SettingsCubit extends Cubit<SettingsState> {
  SettingsCubit(this._storage)
      : super(
          SettingsState(
            themeMode: _storage.readThemeMode(),
            locale: _storage.readLocale(),
          ),
        );

  final SettingsStorage _storage;

  Future<void> setThemeMode(ThemeMode mode) async {
    emit(state.copyWith(themeMode: mode));
    await _storage.writeThemeMode(mode);
  }

  Future<void> setLocale(Locale? locale) async {
    emit(state.copyWith(locale: locale));
    await _storage.writeLocale(locale);
  }
}

