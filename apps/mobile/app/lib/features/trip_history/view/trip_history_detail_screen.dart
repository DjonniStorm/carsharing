import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../geozone/data/geozones_repository.dart';
import '../../trip/domain/trip_status.dart';
import '../cubit/trip_history_detail_cubit.dart';
import '../data/trip_history_repository.dart';
import 'trip_history_route_map.dart';

class TripHistoryDetailScreen extends StatelessWidget {
  const TripHistoryDetailScreen({super.key, required this.tripId});

  final String tripId;

  String _statusLabel(int status) {
    return switch (status) {
      TripStatusCode.pending => 'trip_history.status.pending'.tr(),
      TripStatusCode.started => 'trip_history.status.started'.tr(),
      TripStatusCode.active => 'trip_history.status.active'.tr(),
      TripStatusCode.paused => 'trip_history.status.paused'.tr(),
      TripStatusCode.finished => 'trip_history.status.finished'.tr(),
      TripStatusCode.cancelled => 'trip_history.status.cancelled'.tr(),
      TripStatusCode.error => 'trip_history.status.error'.tr(),
      _ => 'trip_history.status.unknown'.tr(),
    };
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => TripHistoryDetailCubit(
        context.read<TripHistoryRepository>(),
        context.read<GeozonesRepository>(),
      )..load(tripId),
      child: Scaffold(
        appBar: AppBar(
          title: Text('trip_history.detail_title'.tr()),
          leading: BackButton(onPressed: () => context.pop()),
        ),
        body: BlocConsumer<TripHistoryDetailCubit, TripHistoryDetailState>(
          listenWhen: (p, c) => c is TripHistoryDetailFailure,
          listener: (context, state) {
            if (state is TripHistoryDetailFailure) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(state.message)),
              );
            }
          },
          builder: (context, state) {
            if (state is TripHistoryDetailLoading ||
                state is TripHistoryDetailInitial) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is TripHistoryDetailFailure) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(state.message, textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: () => context.pop(),
                        child: Text('common.back'.tr()),
                      ),
                    ],
                  ),
                ),
              );
            }
            if (state is! TripHistoryDetailLoaded) {
              return const SizedBox.shrink();
            }
            final d = state.data;
            final t = d.trip;
            final car = d.car;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TripHistoryRouteMap(
                    points: d.points,
                    zoneGeometry: state.zoneGeometry,
                    startLat: t.startLat,
                    startLng: t.startLng,
                    finishLat: t.finishLat,
                    finishLng: t.finishLng,
                  ),
                  const SizedBox(height: 16),
                  _kv(context, 'trip_history.status_label'.tr(), _statusLabel(t.status)),
                  _kv(
                    context,
                    'trip_history.started_at'.tr(),
                    DateFormat.yMMMd().add_Hm().format(t.startedAt.toLocal()),
                  ),
                  if (t.finishedAt != null)
                    _kv(
                      context,
                      'trip_history.finished_at'.tr(),
                      DateFormat.yMMMd().add_Hm().format(t.finishedAt!.toLocal()),
                    ),
                  _kv(
                    context,
                    'trip.distance_km'.tr(),
                    t.distanceMeters != null
                        ? (t.distanceMeters! / 1000).toStringAsFixed(2)
                        : t.distance.toStringAsFixed(2),
                  ),
                  if (t.chargedMinutes != null)
                    _kv(
                      context,
                      'trip_history.charged_minutes'.tr(),
                      t.chargedMinutes!.toStringAsFixed(0),
                    ),
                  if (t.priceTime != null && t.priceTime! > 0)
                    _kv(
                      context,
                      'trip_history.price_time'.tr(),
                      t.priceTime!.toStringAsFixed(0),
                    ),
                  if (t.priceDistance != null && t.priceDistance! > 0)
                    _kv(
                      context,
                      'trip_history.price_distance'.tr(),
                      t.priceDistance!.toStringAsFixed(0),
                    ),
                  if (t.pricePause != null && t.pricePause! > 0)
                    _kv(
                      context,
                      'trip_history.price_pause'.tr(),
                      t.pricePause!.toStringAsFixed(0),
                    ),
                  if (t.priceTotal != null)
                    _kv(
                      context,
                      'trip.price'.tr(),
                      t.priceTotal!.toStringAsFixed(0),
                    ),
                  const Divider(height: 24),
                  Text(
                    '${car.brand} ${car.model}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text(car.licensePlate),
                  if (d.violations.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      'trip_history.violations'.tr(),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 6),
                    for (final v in d.violations)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text('• ${v.description}'),
                      ),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _kv(BuildContext context, String k, String v) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              k,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ),
          Expanded(child: Text(v)),
        ],
      ),
    );
  }
}
