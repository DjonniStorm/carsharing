import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';

String? messageFromResponseData(Object? data) {
  if (data is! Map) return null;
  final m = data['message'];
  if (m is String && m.trim().isNotEmpty) return m.trim();
  if (m is List && m.isNotEmpty) {
    final first = m.first;
    if (first is String && first.trim().isNotEmpty) return first.trim();
    return first.toString();
  }
  return null;
}

/// Текст ошибки для UI: сначала `message` из тела ответа Nest, иначе i18n по типу сбоя.
String dioErrorMessage(
  DioException e, {
  String fallbackKey = 'errors.generic',
}) {
  final fromBody = messageFromResponseData(e.response?.data);
  if (fromBody != null) return fromBody;

  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return 'errors.timeout'.tr();
    case DioExceptionType.connectionError:
      return 'errors.network'.tr();
    default:
      break;
  }

  final raw = e.message?.trim();
  if (raw != null && raw.isNotEmpty) {
    if (raw.toLowerCase().contains('http status error')) {
      return fallbackKey.tr();
    }
    return raw;
  }

  return fallbackKey.tr();
}
