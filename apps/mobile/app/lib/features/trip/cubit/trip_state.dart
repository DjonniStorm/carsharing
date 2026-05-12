import 'package:equatable/equatable.dart';

import '../../geozone/domain/geozone_kind.dart';
import '../../geozone/domain/rental_zone.dart';
import '../domain/trip_read.dart';

const Object _kUnset = Object();

class TripState extends Equatable {
  const TripState({
    required this.zonesInView,
    this.selectedZoneId,
    this.activeTrip,
    this.tripMetrics = const {},
    this.loadingZones = false,
    this.tripBusy = false,
    this.errorMessage,
    this.showRentalZones = true,
    this.showParkingZones = true,
  });

  final List<RentalZone> zonesInView;
  final String? selectedZoneId;
  final TripRead? activeTrip;
  final Map<String, dynamic> tripMetrics;

  final bool loadingZones;
  final bool tripBusy;
  final String? errorMessage;

  /// Показ полигонов аренды на карте.
  final bool showRentalZones;

  /// Показ полигонов парковки на карте.
  final bool showParkingZones;

  /// Выбранная для поездки зона аренды (парковки не выбираются).
  RentalZone? get selectedZone {
    final id = selectedZoneId;
    if (id == null) return null;
    for (final z in zonesInView) {
      if (z.id == id && z.kind == GeozoneKind.rental) return z;
    }
    return null;
  }

  TripState copyWith({
    List<RentalZone>? zonesInView,
    Object? selectedZoneId = _kUnset,
    Object? activeTrip = _kUnset,
    Map<String, dynamic>? tripMetrics,
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
      tripMetrics: tripMetrics ?? this.tripMetrics,
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
        tripMetrics.length,
        loadingZones,
        tripBusy,
        errorMessage,
        showRentalZones,
        showParkingZones,
      ];
}
