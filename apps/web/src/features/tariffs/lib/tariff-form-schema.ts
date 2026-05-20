import { FIELD_LIMITS } from "@carsharing/validation";
import { z } from "zod";

import type { TariffEditSnapshot } from "@/features/tariffs/model/tariff-edit-view";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

const tariffPriceField = z
  .union([z.number(), z.string()])
  .transform((value, ctx) => {
    const numericValue =
      typeof value === "number" ? value : Number.parseFloat(String(value));
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: translate(LANG_KEYS.pages.tariffsCreatePricesInvalid),
      });
      return z.NEVER;
    }
    if (numericValue > FIELD_LIMITS.TARIFF_PRICE_MAX) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: translate(LANG_KEYS.pages.tariffsCreatePricesMax, {
          max: FIELD_LIMITS.TARIFF_PRICE_MAX,
        }),
      });
      return z.NEVER;
    }
    return Math.round(numericValue * 100) / 100;
  });

export const tariffFormSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(FIELD_LIMITS.TARIFF_NAME_MIN, {
          message: translate(LANG_KEYS.pages.tariffsCreateNameRequired),
        })
        .max(FIELD_LIMITS.TARIFF_NAME_MAX, {
          message: translate(LANG_KEYS.pages.tariffsCreateNameMaxLength),
        }),
    ),
  pricePerMinute: tariffPriceField,
  pricePerKm: tariffPriceField,
  pausePricePerMinute: tariffPriceField,
  isDefault: z.boolean(),
});

export type TariffFormInput = z.input<typeof tariffFormSchema>;
export type TariffFormParsed = z.output<typeof tariffFormSchema>;

export function parseTariffFormInput(input: TariffFormInput) {
  return tariffFormSchema.safeParse(input);
}

export function tariffSnapshotFromParsed(
  parsed: TariffFormParsed,
): TariffEditSnapshot {
  return {
    name: parsed.name,
    pricePerMinute: parsed.pricePerMinute,
    pricePerKm: parsed.pricePerKm,
    pausePricePerMinute: parsed.pausePricePerMinute,
    isDefault: parsed.isDefault,
  };
}

export function firstTariffFormErrorMessage(
  result: z.ZodSafeParseError<TariffFormInput>,
): string {
  const first = result.error.issues[0];
  return (
    first?.message ?? translate(LANG_KEYS.pages.tariffsCreatePricesInvalid)
  );
}
