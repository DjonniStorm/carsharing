import { UserRole } from "@/entities/user";
import type { LangKey } from "@/shared/i18n/keys";
import { LANG_KEYS } from "@/shared/i18n/keys";

export function userRoleLangKey(role: UserRole): LangKey {
  const r = Number(role);
  switch (r) {
    case UserRole.MANAGER:
      return LANG_KEYS.auth.roleManager;
    case UserRole.DRIVER:
      return LANG_KEYS.auth.roleDriver;
    case UserRole.SYSTEM_ADMIN:
      return LANG_KEYS.auth.roleSystemAdmin;
    default:
      return LANG_KEYS.auth.roleDriver;
  }
}
