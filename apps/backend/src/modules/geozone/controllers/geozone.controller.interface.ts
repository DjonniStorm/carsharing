import { GeozoneCreate } from '../entities/dtos/geozone.create';
import { GeozoneRead } from '../entities/dtos/geozone.read';
import { GeozoneUpdate } from '../entities/dtos/geozone.update';
import { GeozoneVersionCreate } from '../entities/dtos/geozone-version.create';
import { GeozoneVersionRead } from '../entities/dtos/geozone-version.read';

export interface IGeozoneController {
  findAll(includeDeleted: boolean): Promise<GeozoneRead[]>;
  findById(id: string): Promise<GeozoneRead>;
  create(geozone: GeozoneCreate): Promise<GeozoneRead>;
  update(id: string, geozone: GeozoneUpdate): Promise<GeozoneRead>;
  softDelete(id: string): Promise<GeozoneRead>;
  restore(id: string): Promise<GeozoneRead>;
  publishVersion(
    id: string,
    version: GeozoneVersionCreate,
  ): Promise<GeozoneRead>;
  findVersions(id: string): Promise<GeozoneVersionRead[]>;
  findVersionById(id: string, versionId: string): Promise<GeozoneVersionRead>;
  /**
   * `types` — список типов через запятую (как в query), пустая строка = без фильтра по типу.
   */
  findInBoundingBox(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number,
    includeDeleted: boolean,
    types: string,
  ): Promise<GeozoneRead[]>;
  findContainingPoint(
    lon: number,
    lat: number,
    includeDeleted: boolean,
    types: string,
  ): Promise<GeozoneRead[]>;
}
