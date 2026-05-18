import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ConnectivityState {
  const ConnectivityState({this.isOnline = true});

  final bool isOnline;
}

class ConnectivityCubit extends Cubit<ConnectivityState> {
  ConnectivityCubit({Connectivity? connectivity})
      : _connectivity = connectivity ?? Connectivity(),
        super(const ConnectivityState()) {
    _subscription = _connectivity.onConnectivityChanged.listen(_onChanged);
    unawaited(_refresh());
  }

  final Connectivity _connectivity;
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  static bool _isOnline(List<ConnectivityResult> results) {
    if (results.isEmpty) return true;
    return results.any((r) => r != ConnectivityResult.none);
  }

  Future<void> _refresh() async {
    try {
      final results = await _connectivity.checkConnectivity();
      _emitOnline(_isOnline(results));
    } catch (_) {}
  }

  void _onChanged(List<ConnectivityResult> results) {
    _emitOnline(_isOnline(results));
  }

  void _emitOnline(bool online) {
    if (state.isOnline == online) return;
    emit(ConnectivityState(isOnline: online));
  }

  @override
  Future<void> close() async {
    await _subscription?.cancel();
    return super.close();
  }
}
