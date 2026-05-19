import {
  resolveApiErrorMessage,
  type ResolveApiErrorOptions,
} from "@/shared/api/resolve-api-error-message";
import type { LangKey } from "@/shared/i18n/keys";
import { translate } from "@/shared/i18n/translate";
import { notification } from "@/shared/lib/notification";

export function notifyApiError(
  titleKey: LangKey,
  error: unknown,
  options?: ResolveApiErrorOptions,
): void {
  notification.error(
    translate(titleKey),
    resolveApiErrorMessage(error, options),
  );
}
