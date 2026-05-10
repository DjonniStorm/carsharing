/**
 * Ожидающие подтверждения регистрации: код нигде в БД не хранится (учебный проект).
 * При перезапуске сервера записи теряются.
 */
export type PendingEmailVerification = {
  userId: string;
  codeHash: string;
  expiresAt: number;
};

const pendingByEmailNorm = new Map<string, PendingEmailVerification>();

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function setPendingEmailVerification(
  email: string,
  entry: PendingEmailVerification,
): void {
  pendingByEmailNorm.set(normEmail(email), entry);
}

export function getPendingEmailVerification(
  email: string,
): PendingEmailVerification | undefined {
  const key = normEmail(email);
  const entry = pendingByEmailNorm.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    pendingByEmailNorm.delete(key);
    return undefined;
  }
  return entry;
}

export function deletePendingEmailVerification(email: string): void {
  pendingByEmailNorm.delete(normEmail(email));
}
