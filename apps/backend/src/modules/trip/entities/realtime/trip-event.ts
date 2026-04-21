/**
 * Единый словарь имён WS-событий.
 * Зачем: убирает дубли строк по проекту и снижает риск опечаток.
 */
export enum TripWsEvent {
  ConnectionReady = 'connection.ready',
  SubscriptionOk = 'subscription.ok',
  SubscriptionError = 'subscription.error',
  TripStateChanged = 'trip.state.changed',
  TripMetricsUpdated = 'trip.metrics.updated',
  TripRoutePoint = 'trip.route.point',
  TripFinished = 'trip.finished',
  TripWarning = 'trip.warning',
  TripError = 'trip.error',
  CarStateChanged = 'car.state.changed',
  CarLocationUpdated = 'car.location.updated',
  FleetSummaryUpdated = 'fleet.summary.updated',
  TelemetryReceived = 'telemetry.received',
  TelemetryTimeout = 'telemetry.timeout',
  ViolationCreated = 'violation.created',
}
