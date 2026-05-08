export const ViolationJobName = {
  RentalMovementZoneCheck: 'violation.rental_movement_zone_check',
  ParkingZoneCheck: 'violation.parking_zone_check',
} as const;

export type RentalMovementZoneCheckJob = {
  tripId: string;
  recordedAt: string;
  lat: number;
  lon: number;
  speed: number;
  fuelLevel: number;
};

export type ParkingZoneCheckJob = {
  tripId: string;
  recordedAt: string;
  lat: number;
  lon: number;
};

