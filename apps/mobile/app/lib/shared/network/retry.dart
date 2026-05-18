import 'package:dio/dio.dart';

bool isRetryableDio(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.connectionError:
      return true;
    default:
      return false;
  }
}

/// Повторяет [fn] при сетевых сбоях; последнее исключение пробрасывается.
Future<T> withNetworkRetry<T>(
  Future<T> Function() fn, {
  int maxAttempts = 3,
}) async {
  const delaysMs = [1000, 3000];
  Object? lastError;
  StackTrace? lastStack;

  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } on DioException catch (e, st) {
      lastError = e;
      lastStack = st;
      if (!isRetryableDio(e) || attempt >= maxAttempts - 1) {
        rethrow;
      }
    } catch (e, st) {
      lastError = e;
      lastStack = st;
      rethrow;
    }
    final delay = delaysMs[attempt.clamp(0, delaysMs.length - 1)];
    await Future<void>.delayed(Duration(milliseconds: delay));
  }

  if (lastError is DioException) {
    Error.throwWithStackTrace(lastError, lastStack ?? StackTrace.current);
  }
  if (lastError != null) {
    Error.throwWithStackTrace(lastError, lastStack ?? StackTrace.current);
  }
  throw StateError('withNetworkRetry: no result');
}
