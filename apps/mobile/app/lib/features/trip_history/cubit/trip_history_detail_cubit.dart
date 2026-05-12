import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../geozone/data/geozones_repository.dart';
import '../data/trip_history_repository.dart';
import '../domain/trip_history_full_read.dart';
import '../../../shared/geo/geo_json_multi_polygon.dart';

sealed class TripHistoryDetailState extends Equatable {
  const TripHistoryDetailState();

  @override
  List<Object?> get props => [];
}

final class TripHistoryDetailInitial extends TripHistoryDetailState {
  const TripHistoryDetailInitial();
}

final class TripHistoryDetailLoading extends TripHistoryDetailState {
  const TripHistoryDetailLoading();
}

final class TripHistoryDetailLoaded extends TripHistoryDetailState {
  const TripHistoryDetailLoaded({
    required this.data,
    this.zoneGeometry,
  });

  final TripHistoryFullRead data;
  final MultiPolygonCoords? zoneGeometry;

  @override
  List<Object?> get props => [data, zoneGeometry];
}

final class TripHistoryDetailFailure extends TripHistoryDetailState {
  const TripHistoryDetailFailure(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}

class TripHistoryDetailCubit extends Cubit<TripHistoryDetailState> {
  TripHistoryDetailCubit(
    this._tripHistoryRepository,
    this._geozonesRepository,
  ) : super(const TripHistoryDetailInitial());

  final TripHistoryRepository _tripHistoryRepository;
  final GeozonesRepository _geozonesRepository;

  Future<void> load(String tripId) async {
    emit(const TripHistoryDetailLoading());
    try {
      final data = await _tripHistoryRepository.getFull(tripId);
      MultiPolygonCoords? zone;
      final vid = data.trip.geoZoneVersionId;
      if (vid.isNotEmpty) {
        zone = await _geozonesRepository.geometryForVersionId(vid);
      }
      emit(TripHistoryDetailLoaded(data: data, zoneGeometry: zone));
    } catch (e) {
      emit(TripHistoryDetailFailure(e.toString()));
    }
  }
}
