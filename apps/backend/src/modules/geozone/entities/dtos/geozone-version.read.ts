import type { GeoJSONMultiPolygon } from '../geozone.geometry';
import type { GeozoneVersionRules } from '../geozone-version.entity';

export class GeozoneVersionRead {
  id: string;
  geozoneId: string;
  geometry: GeoJSONMultiPolygon;
  rules: GeozoneVersionRules | null;
  createdAt: Date;
  disabledAt: Date | null;
}
