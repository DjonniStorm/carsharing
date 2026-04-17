export const DOMAIN_EVENTS = {
  vehicleUpdated: 'vehicle.updated',
  tripStarted: 'trip.started',
  tripFinished: 'trip.finished',
  violationCreated: 'violation.created',
} as const;

export type VehicleUpdatedEvent = {
  vehicleId: number;
  lat: number;
  lon: number;
};

export type TripStartedEvent = {
  tripId: number;
  driverId: number;
  vehicleId: number;
  startedAt: Date;
};

export type TripFinishedEvent = {
  tripId: number;
  driverId: number;
  finishedAt: Date;
};

export type ViolationCreatedEvent = {
  violationId: number;
  tripId: number;
  createdAt: Date;
};
