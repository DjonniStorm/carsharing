import type { GeozoneRead, GeozoneVersionRead } from "@/entities/geozone";
import { geozonesApi } from "@/features/geozones/api";
import { HttpApiError } from "@/shared/api/http-api-error";

/** Подменяет «текущую» версию на ту, что была у поездки — для полигона на карте. */
export function mergeGeozoneWithVersion(
  geozone: GeozoneRead,
  version: GeozoneVersionRead,
): GeozoneRead {
  return {
    ...geozone,
    currentVersionId: version.id,
    currentVersion: { ...version },
  };
}

/**
 * По `trip.geoZoneVersionId` находит геозону и геометрию версии через уже существующие эндпоинты
 * (`GET /geozones`, `GET /geozones/:id/versions/:versionId`).
 */
export async function resolveTripGeozoneForMap(
  geoZoneVersionId: string | undefined | null,
): Promise<GeozoneRead | null> {
  const vid = geoZoneVersionId?.trim();
  if (!vid) {
    return null;
  }

  const zones = await geozonesApi.findAll(true);
  for (const z of zones) {
    try {
      const version = await geozonesApi.findVersionById(z.id, vid);
      return mergeGeozoneWithVersion(z, version);
    } catch (e) {
      if (e instanceof HttpApiError && e.status === 404) {
        continue;
      }
      throw e;
    }
  }
  return null;
}
