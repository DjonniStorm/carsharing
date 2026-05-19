import { action, atom, wrap } from "@reatom/core";

import { GeozoneType } from "@/entities/geozone";
import { geozonesApi } from "@/features/geozones/api";
import { multiPolygonFirstOuterRing } from "@/features/geozones/lib/geojson-ring";
import { HttpApiError } from "@/shared/api/http-api-error";
import type { YMapLngLat } from "@/shared/lib/yandex-maps/ymaps3";

function normalizeColorHex(raw: string): string {
  const trimmed = raw.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return withHash.slice(0, 32);
}

export type GeozoneEditInitialMeta = {
  name: string;
  type: GeozoneType;
  color: string;
};

export type GeozoneEditInitialVersion = {
  ringJson: string;
  tariffPresetId: string | null;
  rulesJson: string;
};

export type GeozoneEditHydration = {
  meta: GeozoneEditInitialMeta;
  version: GeozoneEditInitialVersion;
  closedRing: YMapLngLat[] | null;
  rulesJson: string;
  tariffPresetId: string | null;
};

export type GeozoneEditLoadPhase = "loading" | "ok" | "error";

export const geozoneEditLoadPhaseAtom = atom<GeozoneEditLoadPhase>(
  "loading",
  "geozoneEditLoadPhase",
);

export const geozoneEditLoadErrorAtom = atom<string | null>(
  null,
  "geozoneEditLoadError",
);

export const geozoneEditHydrationAtom = atom<GeozoneEditHydration | null>(
  null,
  "geozoneEditHydration",
);

let geozoneEditLoadSeq = 0;

export const resetGeozoneEditPage = action(() => {
  geozoneEditLoadSeq += 1;
  geozoneEditLoadPhaseAtom.set("loading");
  geozoneEditLoadErrorAtom.set(null);
  geozoneEditHydrationAtom.set(null);
}, "resetGeozoneEditPage");

export const failGeozoneEditNotFound = action(() => {
  geozoneEditLoadPhaseAtom.set("error");
  geozoneEditLoadErrorAtom.set("not_found");
}, "failGeozoneEditNotFound");

export const loadGeozoneEditPage = action(async (geozoneId: string) => {
  const seq = ++geozoneEditLoadSeq;
  geozoneEditLoadPhaseAtom.set("loading");
  geozoneEditLoadErrorAtom.set(null);
  geozoneEditHydrationAtom.set(null);

  try {
    const zone = await wrap(geozonesApi.findById(geozoneId));
    let version = null;
    if (zone.currentVersionId) {
      version = await wrap(
        geozonesApi.findVersionById(geozoneId, zone.currentVersionId),
      );
    }
    if (seq !== geozoneEditLoadSeq) {
      return;
    }

    const meta: GeozoneEditInitialMeta = {
      name: zone.name,
      type: zone.type,
      color: normalizeColorHex(zone.color),
    };

    const ring =
      version !== null ? multiPolygonFirstOuterRing(version.geometry) : null;
    const presetId = version?.tariffPresetId ?? null;
    const rulesText =
      version?.rules != null ? JSON.stringify(version.rules, null, 2) : "";

    geozoneEditHydrationAtom.set({
      meta,
      version: {
        ringJson: ring ? JSON.stringify(ring) : "",
        tariffPresetId: presetId,
        rulesJson: JSON.stringify(version?.rules ?? null),
      },
      closedRing: ring,
      rulesJson: rulesText,
      tariffPresetId: presetId,
    });
    geozoneEditLoadPhaseAtom.set("ok");
  } catch (e) {
    if (seq !== geozoneEditLoadSeq) {
      return;
    }
    const msg =
      e instanceof HttpApiError && e.status === 404
        ? "not_found"
        : e instanceof Error
          ? e.message
          : String(e);
    geozoneEditLoadErrorAtom.set(msg);
    geozoneEditLoadPhaseAtom.set("error");
  }
}, "loadGeozoneEditPage");
