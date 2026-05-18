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
      z.string().min(1, {
        message: translate(LANG_KEYS.pages.geozonesCreateNameRequired),
      }),
    ),
  type: z.nativeEnum(GeozoneType),
  color: z
    .string()
    .transform((value) => normalizeGeozoneColorHex(value))
    .pipe(z.string().min(1)),
});

export const geozoneTariffPresetIdSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z.string().min(1, {
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
