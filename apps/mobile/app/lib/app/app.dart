import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../features/settings/cubit/settings_cubit.dart';
import '../features/settings/cubit/settings_state.dart';
import '../shared/widgets/offline_banner.dart';
import 'localization/app_locales.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

class App extends StatelessWidget {
  const App({super.key, required this.router});

  final AppRouter router;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SettingsCubit, SettingsState>(
      builder: (context, settings) {
        return MaterialApp.router(
          title: 'Carsharing',
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: settings.themeMode,
          locale: settings.locale ?? context.locale,
          supportedLocales: AppLocales.supportedLocales,
          localizationsDelegates: context.localizationDelegates,
          routerConfig: router.goRouter,
          builder: (context, child) {
            return Column(
              children: [
                const OfflineBanner(),
                Expanded(child: child ?? const SizedBox.shrink()),
              ],
            );
          },
        );
      },
    );
  }
}

