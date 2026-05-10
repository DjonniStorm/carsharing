import { GeozoneType } from "@/entities/geozone";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

export function geozoneTypeLangKey(type: GeozoneType): LangKey {
  switch (type) {
    case GeozoneType.RENTAL:
      return LANG_KEYS.pages.geozonesTypeRental;
    case GeozoneType.PARKING:
      return LANG_KEYS.pages.geozonesTypeParking;
    case GeozoneType.OTHER:
      return LANG_KEYS.pages.geozonesTypeOther;
  }
}

export const GEOZONE_TYPES_ORDERED: GeozoneType[] = [
  GeozoneType.RENTAL,
  GeozoneType.PARKING,
  GeozoneType.OTHER,
];
