import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deletePendingVerification,
  getPendingVerification,
  resetAccountVerificationStoreForTests,
  setPendingVerification,
} from '../../account-verification.store';
import { VerificationChannel } from '../../verification-channel.enum';

describe('account-verification.store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAccountVerificationStoreForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetAccountVerificationStoreForTests();
  });

  it('возвращает email pending до истечения TTL', () => {
    const expiresAt = Date.now() + 60_000;
    setPendingVerification('User@Example.com', {
      channel: VerificationChannel.Email,
      userId: 'u1',
      codeHash: 'hash',
      expiresAt,
    });

    const pending = getPendingVerification('user@example.com');
    expect(pending).toEqual({
      channel: VerificationChannel.Email,
      userId: 'u1',
      codeHash: 'hash',
      expiresAt,
    });
  });

  it('удаляет запись после TTL', () => {
    setPendingVerification('a@b.c', {
      channel: VerificationChannel.Sms,
      userId: 'u2',
      sessionInfo: 'sess',
      expiresAt: Date.now() + 1000,
    });

    vi.advanceTimersByTime(1001);

    expect(getPendingVerification('a@b.c')).toBeUndefined();
  });

  it('новый send перезаписывает канал', () => {
    setPendingVerification('a@b.c', {
      channel: VerificationChannel.Email,
      userId: 'u1',
      codeHash: 'h1',
      expiresAt: Date.now() + 60_000,
    });
    setPendingVerification('a@b.c', {
      channel: VerificationChannel.Sms,
      userId: 'u1',
      sessionInfo: 'sess-new',
      expiresAt: Date.now() + 60_000,
    });

    const pending = getPendingVerification('a@b.c');
    expect(pending?.channel).toBe(VerificationChannel.Sms);
    if (pending?.channel === VerificationChannel.Sms) {
      expect(pending.sessionInfo).toBe('sess-new');
    }
  });

  it('deletePendingVerification удаляет запись', () => {
    setPendingVerification('a@b.c', {
      channel: VerificationChannel.Email,
      userId: 'u1',
      codeHash: 'h',
      expiresAt: Date.now() + 60_000,
    });
    deletePendingVerification('a@b.c');
    expect(getPendingVerification('a@b.c')).toBeUndefined();
  });
});
