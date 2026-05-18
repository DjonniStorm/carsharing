import type { TFunction } from "i18next";

import { GeozoneType } from "@/entities/geozone";
import type { GeozoneDrawMode } from "@/features/geozones/create-geozone/ui/geozone-draw-map";
import {
  geozoneTypeLangKey,
  GEOZONE_TYPES_ORDERED,
} from "@/features/geozones/lib/geozone-type-present";
import { LANG_KEYS } from "@/shared/i18n/keys";

export type SelectOption = { value: string; label: string };

export function normalizeGeozoneColorHex(raw: string): string {
  const trimmed = raw.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return withHash.slice(0, 32);
}

export function buildGeozoneTypeSelectData(t: TFunction): SelectOption[] {
  return GEOZONE_TYPES_ORDERED.map((gt) => ({
    value: gt as unknown as string,
    label: t(geozoneTypeLangKey(gt)),
  }));
}

export function buildGeozoneDrawModeSelectData(t: TFunction): SelectOption[] {
  return [
    {
      value: "rectangle" satisfies GeozoneDrawMode,
      label: t(LANG_KEYS.pages.geozonesCreateDrawModeRectangle),
    },
    {
      value: "polygon" satisfies GeozoneDrawMode,
      label: t(LANG_KEYS.pages.geozonesCreateDrawModePolygon),
    },
  ];
}

export const GEOZONE_FORM_DEFAULTS = {
  type: GeozoneType.RENTAL,
  color: "#228be6",
} as const;
