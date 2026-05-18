import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../features/auth/cubit/auth_cubit.dart';
import '../features/auth/data/auth_api.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/geozone/data/geozones_api.dart';
import '../features/geozone/data/geozones_repository.dart';
import '../features/map/cubit/map_cubit.dart';
import '../features/map/data/cars_api.dart';
import '../features/map/data/cars_repository.dart';
import '../features/trip/cubit/trip_cubit.dart';
import '../features/trip/data/trips_api.dart';
import '../features/trip/data/trips_repository.dart';
import '../features/trip_history/data/trip_history_api.dart';
import '../features/trip_history/data/trip_history_repository.dart';
import '../features/profile/cubit/profile_cubit.dart';
import '../features/profile/data/profile_api.dart';
import '../features/profile/data/profile_repository.dart';
import '../features/settings/cubit/settings_cubit.dart';
import '../shared/network/connectivity_cubit.dart';
import '../shared/api/dio_factory.dart';
import '../shared/realtime/trip_realtime_client.dart';
import '../shared/storage/secure_token_storage.dart';
import '../shared/storage/settings_storage.dart';
import 'router/app_router.dart';
import 'app.dart';
import 'localization/app_locales.dart';

Future<Widget> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();
  final settingsStorage = SettingsStorage(prefs);
  final tokenStorage = SecureTokenStorage(const FlutterSecureStorage());

  final tripRealtime = TripRealtimeClient(tokenStorage);
  final dio = DioFactory(
    tokenStorage,
    onUnauthorized: tripRealtime.disconnect,
  ).create();
  final authRepository = AuthRepository(AuthApi(dio));
  final profileRepository = ProfileRepository(ProfileApi(dio));
  final carsRepository = CarsRepository(CarsApi(dio));
  final tripsRepository = TripsRepository(TripsApi(dio));
  final geozonesRepository = GeozonesRepository(GeozonesApi(dio));
  final tripHistoryRepository = TripHistoryRepository(TripHistoryApi(dio));

  final appRouter = AppRouter(tokenStorage: tokenStorage);

  return EasyLocalization(
    supportedLocales: AppLocales.supportedLocales,
    path: 'assets/translations',
    fallbackLocale: AppLocales.fallbackLocale,
    child: MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(value: settingsStorage),
        RepositoryProvider.value(value: tokenStorage),
        RepositoryProvider.value(value: dio),
        RepositoryProvider.value(value: authRepository),
        RepositoryProvider.value(value: profileRepository),
        RepositoryProvider.value(value: carsRepository),
        RepositoryProvider.value(value: tripsRepository),
        RepositoryProvider.value(value: geozonesRepository),
        RepositoryProvider.value(value: tripHistoryRepository),
        RepositoryProvider.value(value: tripRealtime),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(create: (_) => ConnectivityCubit()),
          BlocProvider(create: (_) => SettingsCubit(settingsStorage)),
          BlocProvider(
            create: (_) => AuthCubit(
              repository: authRepository,
              tokenStorage: tokenStorage,
            )..restoreSession(),
          ),
          BlocProvider(
            create: (_) => ProfileCubit(profileRepository)..load(),
          ),
          BlocProvider(
            create: (_) => MapCubit(
              carsRepository: carsRepository,
              realtime: tripRealtime,
            ),
          ),
          BlocProvider(
            create: (_) => TripCubit(
              tripsRepository: tripsRepository,
              geozonesRepository: geozonesRepository,
              realtime: tripRealtime,
            ),
          ),
        ],
        child: App(router: appRouter),
      ),
    ),
  );
}

