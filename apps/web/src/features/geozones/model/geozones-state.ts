import { action, atom, wrap } from "@reatom/core";

import type { GeozoneRead } from "@/entities/geozone";
import { geozonesApi } from "@/features/geozones/api";
import type { GeozoneBoundingBoxQuery } from "@/features/geozones/api";

import { resolveApiErrorMessage } from "@/shared/api";
import type { AsyncStatus } from "@/shared/model/async-status";

export const mapGeozoneBBoxAtom = atom<GeozoneBoundingBoxQuery | null>(
  null,
  "mapGeozoneBBox",
);

export const dashboardGeozonesAtom = atom<GeozoneRead[] | null>(
  null,
  "dashboardGeozones",
);

export const dashboardGeozonesStatusAtom = atom<AsyncStatus>(
  "idle",
  "dashboardGeozonesStatus",
);

export const dashboardGeozonesErrorAtom = atom<string | null>(
  null,
  "dashboardGeozonesError",
);

export const resetDashboardGeozonesState = action(() => {
  dashboardGeozonesAtom.set(null);
  dashboardGeozonesStatusAtom.set("idle");
  dashboardGeozonesErrorAtom.set(null);
  mapGeozoneBBoxAtom.set(null);
}, "resetDashboardGeozonesState");

export const setMapGeozoneBBox = action((bbox: GeozoneBoundingBoxQuery) => {
  mapGeozoneBBoxAtom.set(bbox);
}, "setMapGeozoneBBox");

export const loadDashboardGeozonesForBBox = action(
  async (bbox: GeozoneBoundingBoxQuery) => {
    mapGeozoneBBoxAtom.set(bbox);
    dashboardGeozonesStatusAtom.set("loading");
    dashboardGeozonesErrorAtom.set(null);
    try {
      const list = await wrap(geozonesApi.findInBoundingBox(bbox));
      dashboardGeozonesAtom.set(list);
      dashboardGeozonesStatusAtom.set("idle");
    } catch (e) {
      dashboardGeozonesStatusAtom.set("error");
      dashboardGeozonesErrorAtom.set(resolveApiErrorMessage(e));
    }
  },
  "loadDashboardGeozonesForBBox",
);

export const geozonesCatalogAtom = atom<GeozoneRead[] | null>(
  null,
  "geozonesCatalog",
);

export const geozonesCatalogStatusAtom = atom<AsyncStatus>(
  "idle",
  "geozonesCatalogStatus",
);

export const geozonesCatalogErrorAtom = atom<string | null>(
  null,
  "geozonesCatalogError",
);

export const resetGeozonesCatalogState = action(() => {
  geozonesCatalogAtom.set(null);
  geozonesCatalogStatusAtom.set("idle");
  geozonesCatalogErrorAtom.set(null);
}, "resetGeozonesCatalogState");

export const loadGeozonesCatalog = action(async (includeDeleted = false) => {
  geozonesCatalogStatusAtom.set("loading");
  geozonesCatalogErrorAtom.set(null);
  try {
    const list = await wrap(geozonesApi.findAll(includeDeleted));
    geozonesCatalogAtom.set(list);
    geozonesCatalogStatusAtom.set("idle");
  } catch (e) {
    geozonesCatalogStatusAtom.set("error");
    geozonesCatalogErrorAtom.set(resolveApiErrorMessage(e));
  }
}, "loadGeozonesCatalog");
