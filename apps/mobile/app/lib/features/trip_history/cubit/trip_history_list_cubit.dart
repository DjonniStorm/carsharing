import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../data/trip_history_api.dart';
import '../data/trip_history_repository.dart';
import '../domain/trip_history_short_info_read.dart';

sealed class TripHistoryListState extends Equatable {
  const TripHistoryListState();

  @override
  List<Object?> get props => [];
}

final class TripHistoryListInitial extends TripHistoryListState {
  const TripHistoryListInitial();
}

final class TripHistoryListLoading extends TripHistoryListState {
  const TripHistoryListLoading();
}

final class TripHistoryListLoaded extends TripHistoryListState {
  const TripHistoryListLoaded({
    required this.items,
    required this.hasMore,
    this.isLoadingMore = false,
    this.startedAfterIso,
    this.startedBeforeIso,
  });

  final List<TripHistoryShortInfoRead> items;
  final bool hasMore;
  final bool isLoadingMore;
  final String? startedAfterIso;
  final String? startedBeforeIso;

  TripHistoryListLoaded copyWith({
    List<TripHistoryShortInfoRead>? items,
    bool? hasMore,
    bool? isLoadingMore,
    String? startedAfterIso,
    String? startedBeforeIso,
  }) {
    return TripHistoryListLoaded(
      items: items ?? this.items,
      hasMore: hasMore ?? this.hasMore,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      startedAfterIso: startedAfterIso ?? this.startedAfterIso,
      startedBeforeIso: startedBeforeIso ?? this.startedBeforeIso,
    );
  }

  @override
  List<Object?> get props =>
      [items, hasMore, isLoadingMore, startedAfterIso, startedBeforeIso];
}

final class TripHistoryListFailure extends TripHistoryListState {
  const TripHistoryListFailure(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}

class TripHistoryListCubit extends Cubit<TripHistoryListState> {
  TripHistoryListCubit(this._repository) : super(const TripHistoryListInitial());

  final TripHistoryRepository _repository;

  static const int _pageSize = 20;

  String? _startedAfterIso;
  String? _startedBeforeIso;

  Future<void> loadFirstPage({
    String? startedAfterIso,
    String? startedBeforeIso,
  }) async {
    _startedAfterIso = startedAfterIso;
    _startedBeforeIso = startedBeforeIso;
    emit(const TripHistoryListLoading());
    try {
      final items = await _repository.listShort(
        TripHistoryListQuery(
          limit: _pageSize,
          offset: 0,
          startedAfter: _startedAfterIso,
          startedBefore: _startedBeforeIso,
        ),
      );
      emit(TripHistoryListLoaded(
        items: items,
        hasMore: items.length >= _pageSize,
        startedAfterIso: _startedAfterIso,
        startedBeforeIso: _startedBeforeIso,
      ));
    } catch (e) {
      emit(TripHistoryListFailure(e.toString()));
    }
  }

  Future<void> loadMore() async {
    final s = state;
    if (s is! TripHistoryListLoaded || !s.hasMore || s.isLoadingMore) return;
    emit(s.copyWith(isLoadingMore: true));
    try {
      final more = await _repository.listShort(
        TripHistoryListQuery(
          limit: _pageSize,
          offset: s.items.length,
          startedAfter: _startedAfterIso,
          startedBefore: _startedBeforeIso,
        ),
      );
      final merged = [...s.items, ...more];
      emit(TripHistoryListLoaded(
        items: merged,
        hasMore: more.length >= _pageSize,
        isLoadingMore: false,
        startedAfterIso: _startedAfterIso,
        startedBeforeIso: _startedBeforeIso,
      ));
    } catch (e) {
      emit(s.copyWith(isLoadingMore: false));
    }
  }

  Future<void> refresh() async {
    await loadFirstPage(
      startedAfterIso: _startedAfterIso,
      startedBeforeIso: _startedBeforeIso,
    );
  }
}
