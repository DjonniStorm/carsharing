import type { GeoJSONMultiPolygon } from '../geozone.geometry';
import type { GeozoneVersionRules } from '../geozone-version.entity';

export class GeozoneVersionRead {
  id: string;
  geozoneId: string;
  geometry: GeoJSONMultiPolygon;
  rules: GeozoneVersionRules | null;
  pricePerMinute: number;
  pricePerKm: number;
  pausePricePerMinute: number;
  /** Шаблон, из которого скопировали ставки при публикации этой версии (аудит). */
  tariffPresetId: string | null;
  createdAt: Date;
  disabledAt: Date | null;
}
