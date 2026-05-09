/**
 * Временный режим: разрешить в `POST /auth/register` поле `role: MANAGER` без JWT.
 * Выключается удалением переменной или значением не true/1/yes.
 */
export function isOpenManagerSelfRegisterEnabled(): boolean {
  const v = process.env.OPEN_MANAGER_SELF_REGISTER?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}
