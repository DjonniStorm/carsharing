import { z } from "zod";

import { ViolationStatus } from "@/entities/violation";
import { VIOLATION_CREATABLE_STATUSES_ORDERED } from "@/features/violations/lib/violation-status-present";
import { LANG_KEYS } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";

const creatableStatusSet = new Set<number>(VIOLATION_CREATABLE_STATUSES_ORDERED);

export const violationCreateFormSchema = z.object({
  tripId: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z.uuid({
        message: translate(LANG_KEYS.pages.violationsCreateTripIdInvalid),
      }),
    ),
  type: z
    .number()
    .int()
    .refine((status) => creatableStatusSet.has(status), {
      message: translate(LANG_KEYS.pages.violationsCreateFieldType),
    })
    .transform((status) => status as ViolationStatus),
  description: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z.string().min(1, {
        message: translate(LANG_KEYS.pages.violationsColDesc),
      }),
    ),
});

export type ViolationCreateFormInput = z.input<typeof violationCreateFormSchema>;
export type ViolationCreateFormParsed = z.output<typeof violationCreateFormSchema>;

export function parseViolationCreateForm(input: ViolationCreateFormInput) {
  return violationCreateFormSchema.safeParse(input);
}

export function firstViolationCreateFormErrorMessage(
  result: z.ZodSafeParseError<ViolationCreateFormInput>,
): string {
  const first = result.error.issues[0];
  return (
    first?.message ?? translate(LANG_KEYS.pages.violationsCreateTripIdInvalid)
  );
}
