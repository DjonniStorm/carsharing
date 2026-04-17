import {
  GeoJsonPolygon,
  TariffType,
  TripType,
  VehicleType,
  ViolationTypeModel,
  ZoneTypeModel,
} from './domain.types';

export type GeoJSONPolygon = GeoJsonPolygon;

export type VehicleEntity = VehicleType;
export type TripEntity = TripType;
export type TariffEntity = TariffType;
export type ZoneEntity = ZoneTypeModel;
export type ViolationEntity = ViolationTypeModel;

export type UserEntity = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  passwordHash: string;
  roleId: number;
  isActive: boolean;
  isDeleted: boolean;
};

export type CreateVehicleInput = Omit<VehicleEntity, 'id' | 'deletedAt'> & {
  deletedAt?: Date | null;
};
export type UpdateVehicleInput = Partial<Omit<VehicleEntity, 'id'>>;

export type CreateTripInput = Omit<TripEntity, 'id' | 'endTime' | 'endLocation'> & {
  endTime?: Date | null;
  endLocation?: TripEntity['endLocation'];
};
export type UpdateTripInput = Partial<Omit<TripEntity, 'id'>>;

export type CreateTariffInput = Omit<TariffEntity, 'id' | 'deletedAt'> & {
  deletedAt?: Date | null;
};
export type UpdateTariffInput = Partial<Omit<TariffEntity, 'id'>>;

export type CreateZoneInput = Omit<ZoneEntity, 'id' | 'deletedAt'> & {
  deletedAt?: Date | null;
};
export type UpdateZoneInput = Partial<Omit<ZoneEntity, 'id'>>;

export type CreateViolationInput = Omit<ViolationEntity, 'id' | 'createdAt'> & {
  createdAt?: Date;
};

export type CreateUserInput = Omit<UserEntity, 'id'>;
