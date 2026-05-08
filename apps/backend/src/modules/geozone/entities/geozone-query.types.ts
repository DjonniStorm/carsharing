import { GeozoneType } from './geozone.type';

/** Фильтры списка стабильных зон (`GeoZone`). */
export type GeozoneListFilters = {
  /** По умолчанию `false` — только зоны с `deletedAt == null`. */
  includeDeleted?: boolean;
  /** Только софт-удалённые. Если задано вместе с `includeDeleted`, приоритет у `onlyDeleted`. */
  onlyDeleted?: boolean;
  types?: GeozoneType[];
  nameContains?: string;
  createdByUserId?: string;
};

export type GeozoneListParams = GeozoneListFilters & {
  withCurrentVersion?: boolean;
  skip?: number;
  take?: number;
};

export type GeozoneVersionListFilters = {
  includeDisabled?: boolean;
};

export type GeozoneFindByIdOptions = {
  withCurrentVersion?: boolean;
};

export type GeozoneBoundingBoxParams = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
  includeDeleted?: boolean;
  types?: GeozoneType[];
};

export type GeozoneContainingPointParams = {
  lon: number;
  lat: number;
  types?: GeozoneType[];
  includeDeleted?: boolean;
};
