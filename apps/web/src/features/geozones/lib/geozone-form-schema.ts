import { FIELD_LIMITS } from "@carsharing/validation";
import { z } from "zod";

import { GeozoneType } from "@/entities/geozone";
import { normalizeGeozoneColorHex } from "@/features/geozones/lib/geozone-form-present";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

export const geozoneMetaFormSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(FIELD_LIMITS.GEOZONE_NAME_MIN, {
          message: translate(LANG_KEYS.pages.geozonesCreateNameRequired),
        })
        .max(FIELD_LIMITS.GEOZONE_NAME_MAX, {
          message: translate(LANG_KEYS.validation.geozoneNameMax),
        }),
    ),
  type: z.nativeEnum(GeozoneType),
  color: z
    .string()
    .transform((value) => normalizeGeozoneColorHex(value))
    .pipe(
      z
        .string()
        .min(FIELD_LIMITS.GEOZONE_COLOR_MIN)
        .max(FIELD_LIMITS.GEOZONE_COLOR_MAX, {
          message: translate(LANG_KEYS.validation.geozoneColorMax),
        }),
    ),
});

export const geozoneTariffPresetIdSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z.string().min(FIELD_LIMITS.NON_EMPTY_STRING_MIN, {
      message: translate(LANG_KEYS.pages.geozonesCreateTariffPresetRequired),
    }),
  );

export type GeozoneMetaFormInput = z.input<typeof geozoneMetaFormSchema>;

export function parseGeozoneMetaForm(input: GeozoneMetaFormInput) {
  return geozoneMetaFormSchema.safeParse(input);
}

export function parseGeozoneTariffPresetId(tariffPresetId: string | null) {
  return geozoneTariffPresetIdSchema.safeParse(tariffPresetId ?? "");
}

export function firstGeozoneFormErrorMessage(
  result: z.ZodSafeParseError<unknown>,
): string {
  const first = result.error.issues[0];
  return (
    first?.message ?? translate(LANG_KEYS.pages.geozonesCreateNameRequired)
  );
}
