import { FIELD_LIMITS } from "@carsharing/validation";
import { z } from "zod";

import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

const refineTrimmedString = (min: number, max: number) => {
  return (val: string, ctx: z.RefinementCtx) => {
    const v = val.trim();
    if (v.length < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: translate(LANG_KEYS.pages.carsAddValidateRequired),
      });
      return;
    }
    if (v.length > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: translate(LANG_KEYS.pages.carsAddValidateMaxLen, { max }),
      });
    }
  };
};

const refineMileage = (val: number, ctx: z.RefinementCtx) => {
  if (!Number.isFinite(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: translate(LANG_KEYS.pages.carsAddValidateMileage),
    });
    return;
  }
  if (val < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: translate(LANG_KEYS.pages.carsAddValidateMileage),
    });
  }
};

const refineFuel = (val: number, ctx: z.RefinementCtx) => {
  if (!Number.isFinite(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: translate(LANG_KEYS.pages.carsAddValidateFuel),
    });
    return;
  }
  if (val < 0 || val > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: translate(LANG_KEYS.pages.carsAddValidateFuel),
    });
  }
};

/** Поля формы «новый автомобиль» (без статуса и флага доступности — задаются при сборке тела запроса). */
export const addCarFormSchema = z.object({
  brand: z
    .string()
    .superRefine(
      refineTrimmedString(
        FIELD_LIMITS.CAR_STRING_MIN,
        FIELD_LIMITS.CAR_STRING_MAX,
      ),
    )
    .transform((s) => s.trim()),
  model: z
    .string()
    .superRefine(
      refineTrimmedString(
        FIELD_LIMITS.CAR_STRING_MIN,
        FIELD_LIMITS.CAR_STRING_MAX,
      ),
    )
    .transform((s) => s.trim()),
  licensePlate: z
    .string()
    .superRefine(
      refineTrimmedString(
        FIELD_LIMITS.CAR_STRING_MIN,
        FIELD_LIMITS.CAR_STRING_MAX,
      ),
    )
    .transform((s) => s.trim()),
  color: z
    .string()
    .superRefine(
      refineTrimmedString(
        FIELD_LIMITS.CAR_STRING_MIN,
        FIELD_LIMITS.CAR_STRING_MAX,
      ),
    )
    .transform((s) => s.trim()),
  mileage: z.number().superRefine(refineMileage),
  fuelLevel: z.number().superRefine(refineFuel),
});

export type AddCarFormOutput = z.infer<typeof addCarFormSchema>;
