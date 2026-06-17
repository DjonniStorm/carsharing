import { GeozoneType } from "@/entities/geozone";

export const GEOZONE_PARKING_ZERO_PRICING = {
  pricePerMinute: 0,
  pricePerKm: 0,
  pausePricePerMinute: 0,
} as const;

export function isParkingGeozone(type: GeozoneType): boolean {
  return type === GeozoneType.PARKING;
}
