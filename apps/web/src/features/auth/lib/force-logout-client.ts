import { rootFrame } from "@/app/store";
import { clearSession } from "@/features/auth/model/session";

/** Сброс сессии вне React (например, из `router.beforeLoad`). */
export function forceLogoutClient(): void {
  rootFrame.run(() => clearSession());
}
