import { VerificationChannel } from './verification-channel.enum';

/**
 * Ожидающие подтверждения регистрации: код/sessionInfo нигде в БД не хранится.
 * При перезапуске сервера записи теряются.
 */
export type PendingVerification =
  | {
      channel: VerificationChannel.Email;
      userId: string;
      codeHash: string;
      expiresAt: number;
    }
  | {
      channel: VerificationChannel.Sms;
      userId: string;
      sessionInfo: string;
      expiresAt: number;
    };

const pendingByEmailNorm = new Map<string, PendingVerification>();

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function setPendingVerification(
  email: string,
  entry: PendingVerification,
): void {
  pendingByEmailNorm.set(normEmail(email), entry);
}

export function getPendingVerification(
  email: string,
): PendingVerification | undefined {
  const key = normEmail(email);
  const entry = pendingByEmailNorm.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    pendingByEmailNorm.delete(key);
    return undefined;
  }
  return entry;
}

export function deletePendingVerification(email: string): void {
  pendingByEmailNorm.delete(normEmail(email));
}

/** Сброс in-memory store между тестами. */
export function resetAccountVerificationStoreForTests(): void {
  pendingByEmailNorm.clear();
}
