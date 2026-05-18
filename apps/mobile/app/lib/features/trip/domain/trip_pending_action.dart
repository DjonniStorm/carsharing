import '../../geozone/domain/rental_zone.dart';
import '../../map/domain/car_position.dart';

sealed class TripPendingAction {
  const TripPendingAction();
}

class TripPendingStart extends TripPendingAction {
  const TripPendingStart({
    required this.userId,
    required this.car,
    required this.zone,
  });

  final String userId;
  final CarPosition car;
  final RentalZone zone;
}

class TripPendingFinish extends TripPendingAction {
  const TripPendingFinish({this.finishLat, this.finishLng});

  final double? finishLat;
  final double? finishLng;
}

class TripPendingCancel extends TripPendingAction {
  const TripPendingCancel();
}

class TripPendingPatch extends TripPendingAction {
  const TripPendingPatch(this.body);

  final Map<String, dynamic> body;
}
