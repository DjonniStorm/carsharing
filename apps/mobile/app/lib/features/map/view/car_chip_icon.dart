import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';

/// Рисует chip с текстом (номер авто) => возвращает PNG-байты для BitmapDescriptor.
Future<Uint8List> renderCarChipBytes(
  String text, {
  required bool selected,
  required bool muted,
  bool mine = false,
  double pixelRatio = 3,
}) async {
  final label = text.trim().isEmpty ? '—' : text.trim();
  const fontSize = 13.0;
  const padH = 12.0;
  const padV = 6.0;

  final tp = TextPainter(
    text: TextSpan(
      text: label,
      style: const TextStyle(
        color: Colors.white,
        fontSize: fontSize,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.4,
      ),
    ),
    textDirection: TextDirection.ltr,
    maxLines: 1,
  )..layout();

  final width = math.max(64.0, tp.width + padH * 2);
  const tipH = 8.0;
  final height = tp.height + padV * 2 + tipH;

  final w = (width * pixelRatio).round();
  final h = (height * pixelRatio).round();

  final recorder = ui.PictureRecorder();
  final canvas = Canvas(
    recorder,
    Rect.fromLTWH(0, 0, w.toDouble(), h.toDouble()),
  );
  canvas.scale(pixelRatio);

  final Color bg;
  final Color edge;
  if (mine) {
    bg = const Color(0xFF10B981);
    edge = const Color(0xFF065F46);
  } else if (muted) {
    bg = const Color(0xFF6B7280);
    edge = const Color(0xFF374151);
  } else if (selected) {
    bg = const Color(0xFF7C3AED);
    edge = const Color(0xFF4C1D95);
  } else {
    bg = const Color(0xFF8B5CF6);
    edge = const Color(0xFF5B21B6);
  }

  final bodyRect = RRect.fromRectAndRadius(
    Rect.fromLTWH(1, 1, width - 2, height - tipH - 1),
    const Radius.circular(14),
  );

  final shadow = Paint()
    ..color = Colors.black.withAlpha(60)
    ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
  canvas.drawRRect(bodyRect.shift(const Offset(0, 1.5)), shadow);

  final bgPaint = Paint()..color = bg;
  canvas.drawRRect(bodyRect, bgPaint);

  final edgePaint = Paint()
    ..style = PaintingStyle.stroke
    ..strokeWidth = 1.2
    ..color = edge;
  canvas.drawRRect(bodyRect, edgePaint);

  final tipPath = Path()
    ..moveTo(width / 2 - 6, height - tipH - 1)
    ..lineTo(width / 2, height - 1)
    ..lineTo(width / 2 + 6, height - tipH - 1)
    ..close();
  canvas.drawPath(tipPath, bgPaint);
  canvas.drawPath(tipPath, edgePaint);

  tp.paint(canvas, Offset((width - tp.width) / 2, padV + 0.5));

  final picture = recorder.endRecording();
  final image = await picture.toImage(w, h);
  final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
  return byteData!.buffer.asUint8List();
}

class CarChipIconCache {
  CarChipIconCache();

  final Map<String, BitmapDescriptor> _cache = {};

  /// Якорь: середина по горизонтали, низ «хвоста» — в точку.
  static const Offset anchor = Offset(0.5, 1.0);

  String _key(
    String plate, {
    required bool selected,
    required bool muted,
    required bool mine,
  }) => '${plate}_${mine ? 'i' : ''}${selected ? 's' : ''}${muted ? 'm' : ''}';

  BitmapDescriptor? get(
    String plate, {
    required bool selected,
    required bool muted,
    bool mine = false,
  }) {
    return _cache[_key(plate, selected: selected, muted: muted, mine: mine)];
  }

  /// Гарантирует, что для всех вариантов есть готовая иконка.
  /// Возвращает true, если в кэш что-то добавлено (нужно перерисовать слой).
  Future<bool> ensure(
    Iterable<({String plate, bool selected, bool muted, bool mine})> items,
  ) async {
    var changed = false;
    for (final it in items) {
      final k = _key(
        it.plate,
        selected: it.selected,
        muted: it.muted,
        mine: it.mine,
      );
      if (_cache.containsKey(k)) continue;
      final bytes = await renderCarChipBytes(
        it.plate,
        selected: it.selected,
        muted: it.muted,
        mine: it.mine,
      );
      _cache[k] = BitmapDescriptor.fromBytes(bytes);
      changed = true;
    }
    return changed;
  }
}
