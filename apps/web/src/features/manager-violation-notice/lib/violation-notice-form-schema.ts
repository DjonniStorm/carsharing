import { FIELD_LIMITS } from "@carsharing/validation";
import { z } from "zod";

import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

export const violationNoticeFormSchema = z.object({
  subject: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(FIELD_LIMITS.NOTICE_SUBJECT_MIN, {
          message: translate(
            LANG_KEYS.pages.tripViolationNoticeWarnSubjectBody,
          ),
        })
        .max(FIELD_LIMITS.NOTICE_SUBJECT_MAX, {
          message: translate(LANG_KEYS.validation.noticeSubjectMax),
        }),
    ),
  message: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(FIELD_LIMITS.NOTICE_MESSAGE_MIN, {
          message: translate(
            LANG_KEYS.pages.tripViolationNoticeWarnMessageBody,
          ),
        })
        .max(FIELD_LIMITS.NOTICE_MESSAGE_MAX, {
          message: translate(LANG_KEYS.validation.noticeMessageMax),
        }),
    ),
});

export type ViolationNoticeFormInput = z.input<
  typeof violationNoticeFormSchema
>;

export function parseViolationNoticeForm(input: ViolationNoticeFormInput) {
  return violationNoticeFormSchema.safeParse(input);
}
