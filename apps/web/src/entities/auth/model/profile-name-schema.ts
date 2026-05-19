import { FIELD_LIMITS } from "@carsharing/validation";
import { z } from "zod";

import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

export const profileNameSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(FIELD_LIMITS.USER_DISPLAY_NAME_MIN, {
        message: translate(LANG_KEYS.validation.nameMin),
      })
      .max(FIELD_LIMITS.USER_DISPLAY_NAME_MAX, {
        message: translate(LANG_KEYS.validation.nameMax),
      }),
  );

export function parseProfileName(input: string) {
  return profileNameSchema.safeParse(input);
}
