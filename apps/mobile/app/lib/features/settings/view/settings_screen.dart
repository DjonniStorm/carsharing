import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../cubit/settings_cubit.dart';
import '../../../app/localization/app_locales.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<SettingsCubit>();
    final state = context.watch<SettingsCubit>().state;

    return Scaffold(
      appBar: AppBar(
        title: Text('settings.title'.tr()),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: ListView(
        children: [
          ListTile(
            title: Text('settings.theme'.tr()),
            subtitle: Text(state.themeMode == ThemeMode.light
                ? 'settings.theme_light'.tr()
                : 'settings.theme_dark'.tr()),
            trailing: Switch(
              value: state.themeMode == ThemeMode.dark,
              onChanged: (v) =>
                  cubit.setThemeMode(v ? ThemeMode.dark : ThemeMode.light),
            ),
          ),
          const Divider(height: 1),
          ListTile(
            title: Text('settings.language'.tr()),
            subtitle: Text((state.locale ?? context.locale).toLanguageTag()),
            trailing: DropdownButtonHideUnderline(
              child: DropdownButton<Locale>(
                value: state.locale ?? context.locale,
                items: AppLocales.supportedLocales
                    .map(
                      (l) => DropdownMenuItem(
                        value: l,
                        child: Text(l.toLanguageTag()),
                      ),
                    )
                    .toList(growable: false),
                onChanged: (locale) async {
                  if (locale == null) return;
                  await context.setLocale(locale);
                  await cubit.setLocale(locale);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

