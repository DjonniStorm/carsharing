class TripWsCommand {
  static const subscribeTrip = 'subscribe.trip';
  static const unsubscribeTrip = 'unsubscribe.trip';
  static const subscribeCar = 'subscribe.car';
  static const unsubscribeCar = 'unsubscribe.car';
  static const subscribeFleet = 'subscribe.fleet';
  static const unsubscribeFleet = 'unsubscribe.fleet';
}

class TripWsEvent {
  static const connectionReady = 'connection.ready';
  static const subscriptionOk = 'subscription.ok';
  static const subscriptionError = 'subscription.error';
  static const tripStateChanged = 'trip.state.changed';
  static const tripMetricsUpdated = 'trip.metrics.updated';
  static const tripRoutePoint = 'trip.route.point';
  static const tripFinished = 'trip.finished';
  static const tripWarning = 'trip.warning';
  static const tripError = 'trip.error';
  static const carStateChanged = 'car.state.changed';
  static const carLocationUpdated = 'car.location.updated';
  static const fleetSummaryUpdated = 'fleet.summary.updated';
  static const telemetryReceived = 'telemetry.received';
  static const telemetryTimeout = 'telemetry.timeout';
  static const violationCreated = 'violation.created';
  static const violationUpdated = 'violation.updated';
}

