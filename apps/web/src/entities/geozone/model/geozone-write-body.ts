import type { GeozoneType } from "@/entities/geozone/model/geozone-type";
import type { GeoJSONMultiPolygon } from "@/entities/geozone/model/geozone-geometry";

export type GeozoneCreateBody = {
  name: string;
  type: GeozoneType;
  color: string;
  geometry: GeoJSONMultiPolygon;
  rules?: Record<string, unknown> | null;
  /** Если задан — ставки копируются из шаблона; иначе нужны явные `price*`. */
  tariffPresetId?: string;
  pricePerMinute?: number;
  pricePerKm?: number;
  pausePricePerMinute?: number;
  createdByUserId?: string;
};

export type GeozoneUpdateBody = Partial<{
  name: string;
  type: GeozoneType;
  color: string;
}>;

export type GeozoneVersionCreateBody = {
  geometry: GeoJSONMultiPolygon;
  rules?: Record<string, unknown> | null;
  tariffPresetId?: string;
  pricePerMinute?: number;
  pricePerKm?: number;
  pausePricePerMinute?: number;
};
