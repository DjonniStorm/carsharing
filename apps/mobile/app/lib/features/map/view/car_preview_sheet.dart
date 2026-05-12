import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../domain/car_position.dart';

/// Модальное превью авто перед началом поездки.
///
/// Возвращает `true`, если пользователь нажал «Выбрать».
/// `false`/`null` — закрыто без выбора (можно тапнуть другое авто).
Future<bool?> showCarPreviewSheet(
  BuildContext context, {
  required CarPosition car,
  required bool canSelect,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) {
      return _CarPreviewSheet(car: car, canSelect: canSelect);
    },
  );
}

class _CarPreviewSheet extends StatelessWidget {
  const _CarPreviewSheet({required this.car, required this.canSelect});

  final CarPosition car;
  final bool canSelect;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final plate = car.licensePlate?.trim();
    final title = (plate?.isNotEmpty ?? false) ? plate! : '—';
    final subtitle = car.displayName;

    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 4,
          bottom: MediaQuery.viewInsetsOf(context).bottom + 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      if (subtitle.isNotEmpty)
                        Text(
                          subtitle,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'common.cancel'.tr(),
                  onPressed: () => Navigator.of(context).pop(false),
                  icon: const Icon(Icons.close_rounded),
                ),
              ],
            ),
            const SizedBox(height: 8),
            _Specs(car: car),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    child: Text('common.cancel'.tr()),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: canSelect
                        ? () => Navigator.of(context).pop(true)
                        : null,
                    icon: const Icon(Icons.check_rounded),
                    label: Text('map.select_this_car'.tr()),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Specs extends StatelessWidget {
  const _Specs({required this.car});

  final CarPosition car;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final rows = <Widget>[
      if (car.brand?.trim().isNotEmpty == true)
        _row(theme, Icons.directions_car_filled_rounded,
            'car.brand'.tr(), car.brand!),
      if (car.model?.trim().isNotEmpty == true)
        _row(theme, Icons.car_repair_rounded, 'car.model'.tr(), car.model!),
      if (car.color?.trim().isNotEmpty == true)
        _row(theme, Icons.palette_outlined, 'car.color'.tr(), car.color!),
      if (car.mileage != null)
        _row(theme, Icons.speed_rounded, 'car.mileage'.tr(),
            '${car.mileage!.toStringAsFixed(0)} ${'car.km'.tr()}'),
      if (car.fuelLevel != null)
        _row(theme, Icons.local_gas_station_rounded, 'car.fuel_level'.tr(),
            '${car.fuelLevel!.toStringAsFixed(0)}%'),
      _row(
        theme,
        car.isAvailable
            ? Icons.check_circle_outline_rounded
            : Icons.do_not_disturb_alt_rounded,
        'car.status'.tr(),
        car.isAvailable
            ? 'car.status_available'.tr()
            : 'car.status_unavailable'.tr(),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: rows,
    );
  }

  Widget _row(ThemeData theme, IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: theme.colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
