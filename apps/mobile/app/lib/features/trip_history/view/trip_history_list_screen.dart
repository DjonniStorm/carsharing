import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_routes.dart';
import '../../trip/domain/trip_status.dart';
import '../cubit/trip_history_list_cubit.dart';
import '../data/trip_history_repository.dart';
import '../domain/trip_history_short_info_read.dart';

class TripHistoryListScreen extends StatefulWidget {
  const TripHistoryListScreen({super.key});

  @override
  State<TripHistoryListScreen> createState() => _TripHistoryListScreenState();
}

class _TripHistoryListScreenState extends State<TripHistoryListScreen> {
  DateTime? _fromDate;
  DateTime? _toDate;

  static String? _isoStartLocalDay(DateTime d) {
    final local = DateTime(d.year, d.month, d.day);
    return local.toUtc().toIso8601String();
  }

  static String? _isoEndLocalDay(DateTime d) {
    final local = DateTime(d.year, d.month, d.day, 23, 59, 59, 999);
    return local.toUtc().toIso8601String();
  }

  Future<void> _pickFrom() async {
    final now = DateTime.now();
    final initial = _fromDate ?? now;
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime(now.year - 5),
      lastDate: DateTime(now.year + 1),
      initialDate: initial,
    );
    if (picked != null && mounted) setState(() => _fromDate = picked);
  }

  Future<void> _pickTo() async {
    final now = DateTime.now();
    final initial = _toDate ?? now;
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime(now.year - 5),
      lastDate: DateTime(now.year + 1),
      initialDate: initial,
    );
    if (picked != null && mounted) setState(() => _toDate = picked);
  }

  void _applyFilter(BuildContext context) {
    context.read<TripHistoryListCubit>().loadFirstPage(
          startedAfterIso: _fromDate != null ? _isoStartLocalDay(_fromDate!) : null,
          startedBeforeIso: _toDate != null ? _isoEndLocalDay(_toDate!) : null,
        );
  }

  void _clearFilter(BuildContext context) {
    setState(() {
      _fromDate = null;
      _toDate = null;
    });
    context.read<TripHistoryListCubit>().loadFirstPage();
  }

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
      create: (context) =>
          TripHistoryListCubit(context.read<TripHistoryRepository>())
            ..loadFirstPage(),
      child: Builder(
        builder: (context) {
          return Scaffold(
            appBar: AppBar(
              title: Text('trip_history.title'.tr()),
              leading: BackButton(onPressed: () => context.pop()),
            ),
            body: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      OutlinedButton.icon(
                        onPressed: _pickFrom,
                        icon: const Icon(Icons.date_range, size: 18),
                        label: Text(
                          _fromDate == null
                              ? 'trip_history.filter_from'.tr()
                              : DateFormat.yMMMd().format(_fromDate!),
                        ),
                      ),
                      OutlinedButton.icon(
                        onPressed: _pickTo,
                        icon: const Icon(Icons.date_range, size: 18),
                        label: Text(
                          _toDate == null
                              ? 'trip_history.filter_to'.tr()
                              : DateFormat.yMMMd().format(_toDate!),
                        ),
                      ),
                      FilledButton(
                        onPressed: () => _applyFilter(context),
                        child: Text('trip_history.filter_apply'.tr()),
                      ),
                      TextButton(
                        onPressed: () => _clearFilter(context),
                        child: Text('trip_history.filter_clear'.tr()),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: BlocBuilder<TripHistoryListCubit, TripHistoryListState>(
                    builder: (context, state) {
                      if (state is TripHistoryListLoading) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      if (state is TripHistoryListFailure) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  state.message,
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 16),
                                FilledButton(
                                  onPressed: () =>
                                      context.read<TripHistoryListCubit>().refresh(),
                                  child: Text('common.continue'.tr()),
                                ),
                              ],
                            ),
                          ),
                        );
                      }
                      if (state is! TripHistoryListLoaded) {
                        return const SizedBox.shrink();
                      }
                      final items = state.items;
                      if (items.isEmpty) {
                        return Center(child: Text('trip_history.empty'.tr()));
                      }
                      return RefreshIndicator(
                        onRefresh: () =>
                            context.read<TripHistoryListCubit>().refresh(),
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          itemCount: items.length + (state.hasMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == items.length) {
                              return Padding(
                                padding: const EdgeInsets.all(16),
                                child: Center(
                                  child: state.isLoadingMore
                                      ? const CircularProgressIndicator()
                                      : TextButton(
                                          onPressed: () => context
                                              .read<TripHistoryListCubit>()
                                              .loadMore(),
                                          child: Text('trip_history.load_more'.tr()),
                                        ),
                                ),
                              );
                            }
                            return _TripCard(
                              item: items[index],
                              statusLabel: _statusLabel,
                              onTap: () => context.push(
                                AppRoutes.tripHistoryDetail(items[index].trip.id),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _TripCard extends StatelessWidget {
  const _TripCard({
    required this.item,
    required this.statusLabel,
    required this.onTap,
  });

  final TripHistoryShortInfoRead item;
  final String Function(int status) statusLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = item.trip;
    final car = item.car;
    final price = t.priceTotal;
    final plate = t.carPlateSnapshot?.trim().isNotEmpty == true
        ? t.carPlateSnapshot!.trim()
        : car.licensePlate;
    final model = t.carDisplayNameSnapshot?.trim().isNotEmpty == true
        ? t.carDisplayNameSnapshot!.trim()
        : '${car.brand} ${car.model}'.trim();

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      DateFormat.yMMMd().add_Hm().format(t.startedAt.toLocal()),
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                  ),
                  if (item.violations.isNotEmpty)
                    Chip(
                      label: Text('${item.violations.length}'),
                      visualDensity: VisualDensity.compact,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                statusLabel(t.status),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                    ),
              ),
              const SizedBox(height: 4),
              Text(model, style: Theme.of(context).textTheme.bodyLarge),
              Text(
                plate,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
              if (price != null) ...[
                const SizedBox(height: 8),
                Text(
                  'trip_history.price_total'.tr(args: [price.toStringAsFixed(0)]),
                  style: Theme.of(context).textTheme.labelLarge,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
