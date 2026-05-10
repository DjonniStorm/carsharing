import type { GeozoneType } from "@/entities/geozone/model/geozone-type";
import type {
  GeoJSONMultiPolygon,
  GeozoneVersionRules,
} from "@/entities/geozone/model/geozone-geometry";

export type GeozoneVersionRead = {
  id: string;
  geozoneId: string;
  geometry: GeoJSONMultiPolygon;
  rules: GeozoneVersionRules | null;
  pricePerMinute: number;
  pricePerKm: number;
  pausePricePerMinute: number;
  /** Шаблон тарифа, из которого скопировали ставки при публикации версии. */
  tariffPresetId: string | null;
  createdAt: string;
  disabledAt: string | null;
};

export type GeozoneRead = {
  id: string;
  name: string;
  type: GeozoneType;
  color: string;
  currentVersionId: string | null;
  createdAt: string;
  deletedAt: string | null;
  createdByUserId: string;
  currentVersion?: GeozoneVersionRead;
};
