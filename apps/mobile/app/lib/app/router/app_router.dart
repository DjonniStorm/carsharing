import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../shared/storage/secure_token_storage.dart';
import '../../features/auth/view/login_screen.dart';
import '../../features/auth/view/register_screen.dart';
import '../../features/auth/view/verify_account_screen.dart';
import '../../features/map/view/map_screen.dart';
import '../../features/profile/view/profile_screen.dart';
import '../../features/settings/view/settings_screen.dart';
import '../../features/support/view/support_screen.dart';
import '../../features/trip_history/view/trip_history_detail_screen.dart';
import '../../features/trip_history/view/trip_history_list_screen.dart';
import 'app_routes.dart';
import 'go_router_refresh_stream.dart';

class AppRouter {
  AppRouter({required SecureTokenStorage tokenStorage})
      : _tokenStorage = tokenStorage {
    _goRouter = GoRouter(
      initialLocation: AppRoutes.login,
      refreshListenable: GoRouterRefreshStream(_tokenStorage.changes),
      redirect: (context, state) async {
        final token = await _tokenStorage.readAccessToken();
        final isAuthed = token != null && token.isNotEmpty;

        final loc = state.matchedLocation;
        final isGuestOnlyRoute = loc == AppRoutes.login ||
            loc == AppRoutes.register ||
            loc == AppRoutes.verifyEmail;
        final isPublicRoute = isGuestOnlyRoute || loc == AppRoutes.support;

        if (!isAuthed && !isPublicRoute) return AppRoutes.login;
        if (isAuthed && isGuestOnlyRoute) return AppRoutes.map;
        return null;
      },
      routes: [
        GoRoute(
          path: AppRoutes.login,
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: AppRoutes.register,
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: AppRoutes.verifyEmail,
          builder: (context, state) {
            final email = state.uri.queryParameters['email'] ?? '';
            final phone = state.uri.queryParameters['phone'] ?? '';
            return VerifyAccountScreen(email: email, phone: phone);
          },
        ),
        GoRoute(
          path: AppRoutes.map,
          builder: (context, state) => const MapScreen(),
        ),
        GoRoute(
          path: AppRoutes.profile,
          builder: (context, state) => const ProfileScreen(),
        ),
        GoRoute(
          path: AppRoutes.settings,
          builder: (context, state) => const SettingsScreen(),
        ),
        GoRoute(
          path: AppRoutes.support,
          builder: (context, state) => const SupportScreen(),
        ),
        GoRoute(
          path: AppRoutes.trips,
          builder: (context, state) => const TripHistoryListScreen(),
        ),
        GoRoute(
          path: '/trips/:tripId',
          builder: (context, state) {
            final id = state.pathParameters['tripId'] ?? '';
            return TripHistoryDetailScreen(tripId: id);
          },
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        body: Center(child: Text('Router error: ${state.error}')),
      ),
    );
  }

  final SecureTokenStorage _tokenStorage;
  late final GoRouter _goRouter;

  GoRouter get goRouter => _goRouter;
}

