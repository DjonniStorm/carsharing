export type VehicleStatus = 'ACTIVE' | 'IN_USE' | 'BLOCKED';
export type TripStatus = 'ACTIVE' | 'FINISHED' | 'CANCELLED';
export type ZoneType = 'ALLOWED' | 'PARKING' | 'RESTRICTED';
export type ViolationType = 'OUT_OF_ZONE' | 'SPEEDING' | 'OTHER';

export type GeoJsonPosition = [number, number];

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: GeoJsonPosition[][];
}

export interface VehicleLocation {
  lat: number;
  lon: number;
}

export interface VehicleType {
  id: number;
  brand: string;
  model: string;
  plateNumber: string;
  status: VehicleStatus;
  location: VehicleLocation;
  deletedAt: Date | null;
}

export interface TripType {
  id: number;
  driverId: number;
  vehicleId: number;
  status: TripStatus;
  startTime: Date;
  endTime: Date | null;
  startLocation: VehicleLocation;
  endLocation: VehicleLocation | null;
}

export interface TariffType {
  id: number;
  name: string;
  pricePerMinute: number;
  deletedAt: Date | null;
}

export interface ZoneTypeModel {
  id: number;
  name: string;
  type: ZoneType;
  geometry: GeoJsonPolygon;
  isActive: boolean;
  deletedAt: Date | null;
}

export interface ViolationTypeModel {
  id: number;
  tripId: number;
  type: ViolationType;
  createdAt: Date;
}
