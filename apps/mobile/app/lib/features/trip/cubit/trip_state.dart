import 'package:equatable/equatable.dart';

import '../../geozone/domain/geozone_kind.dart';
import '../../geozone/domain/rental_zone.dart';
import '../domain/live_trip_metrics.dart';
import '../domain/trip_read.dart';

const Object _kUnset = Object();

class TripState extends Equatable {
  const TripState({
    required this.zonesInView,
    this.selectedZoneId,
    this.activeTrip,
    this.liveMetrics,
    this.finishSummary,
    this.loadingZones = false,
    this.tripBusy = false,
    this.errorMessage,
    this.showRentalZones = true,
    this.showParkingZones = true,
  });

  final List<RentalZone> zonesInView;
  final String? selectedZoneId;
  final TripRead? activeTrip;
  final LiveTripMetrics? liveMetrics;
  final TripFinishSummary? finishSummary;

  final bool loadingZones;
  final bool tripBusy;
  final String? errorMessage;

  final bool showRentalZones;
  final bool showParkingZones;

  RentalZone? get selectedZone {
    final id = selectedZoneId;
    if (id == null) return null;
    for (final z in zonesInView) {
      if (z.id == id && z.kind == GeozoneKind.rental) return z;
    }
    return null;
  }

  /// Метрики для UI: WS/live + поля активной поездки.
  LiveTripMetrics? get displayMetrics {
    final trip = activeTrip;
    if (trip == null) return liveMetrics;
    return LiveTripMetrics.merge(liveMetrics, trip);
  }

  TripState copyWith({
    List<RentalZone>? zonesInView,
    Object? selectedZoneId = _kUnset,
    Object? activeTrip = _kUnset,
    Object? liveMetrics = _kUnset,
    Object? finishSummary = _kUnset,
    bool? loadingZones,
    bool? tripBusy,
    Object? errorMessage = _kUnset,
    bool? showRentalZones,
    bool? showParkingZones,
  }) {
    return TripState(
      zonesInView: zonesInView ?? this.zonesInView,
      selectedZoneId: selectedZoneId == _kUnset
          ? this.selectedZoneId
          : selectedZoneId as String?,
      activeTrip:
          activeTrip == _kUnset ? this.activeTrip : activeTrip as TripRead?,
      liveMetrics: liveMetrics == _kUnset
          ? this.liveMetrics
          : liveMetrics as LiveTripMetrics?,
      finishSummary: finishSummary == _kUnset
          ? this.finishSummary
          : finishSummary as TripFinishSummary?,
      loadingZones: loadingZones ?? this.loadingZones,
      tripBusy: tripBusy ?? this.tripBusy,
      errorMessage:
          errorMessage == _kUnset ? this.errorMessage : errorMessage as String?,
      showRentalZones: showRentalZones ?? this.showRentalZones,
      showParkingZones: showParkingZones ?? this.showParkingZones,
    );
  }

  @override
  List<Object?> get props => [
        zonesInView.length,
        selectedZoneId,
        activeTrip?.id,
        activeTrip?.status,
        activeTrip?.priceTotal,
        activeTrip?.distanceMeters,
        liveMetrics?.priceTotal,
        liveMetrics?.distanceMeters,
        finishSummary?.tripId,
        finishSummary?.priceTotal,
        loadingZones,
        tripBusy,
        errorMessage,
        showRentalZones,
        showParkingZones,
      ];
}
