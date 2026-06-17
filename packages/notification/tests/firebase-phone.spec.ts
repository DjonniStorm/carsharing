import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createNotificationClient } from '../src/client.js';
import {
  getFirebaseRecaptchaParams,
  sendFirebasePhoneVerification,
  verifyFirebasePhoneCode,
} from '../src/firebase-phone.js';

const firebaseCfg = {
  apiKey: 'test-api-key',
};

describe('firebase-phone', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getFirebaseRecaptchaParams: возвращает site key', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ recaptchaSiteKey: 'site-key-abc' }), { status: 200 }),
    );

    const result = await getFirebaseRecaptchaParams(firebaseCfg);

    expect(result).toEqual({ recaptchaSiteKey: 'site-key-abc' });
    expect(fetch).toHaveBeenCalledWith(
      'https://identitytoolkit.googleapis.com/v1/recaptchaParams?key=test-api-key',
    );
  });

  it('sendFirebasePhoneVerification: возвращает sessionInfo с recaptchaToken', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ sessionInfo: 'session-abc' }), { status: 200 }),
    );

    const result = await sendFirebasePhoneVerification(
      firebaseCfg,
      '+79991234567',
      'recaptcha-token',
    );

    expect(result).toEqual({ sessionInfo: 'session-abc' });
    expect(fetch).toHaveBeenCalledWith(
      'https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=test-api-key',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: '+79991234567',
          recaptchaToken: 'recaptcha-token',
        }),
      }),
    );
  });

  it('sendFirebasePhoneVerification: бросает при HTTP 400', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'INVALID_PHONE_NUMBER' } }), {
        status: 400,
      }),
    );

    await expect(
      sendFirebasePhoneVerification(firebaseCfg, '+7999', 'recaptcha-token'),
    ).rejects.toThrow(/INVALID_PHONE_NUMBER/);
  });

  it('sendFirebasePhoneVerification: требует E.164', async () => {
    await expect(
      sendFirebasePhoneVerification(firebaseCfg, '79991234567', 'recaptcha-token'),
    ).rejects.toThrow(/E\.164/);
  });

  it('sendFirebasePhoneVerification: требует recaptchaToken', async () => {
    await expect(
      sendFirebasePhoneVerification(firebaseCfg, '+79991234567', '  '),
    ).rejects.toThrow(/recaptchaToken/);
  });

  it('verifyFirebasePhoneCode: возвращает idToken и phoneNumber', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ idToken: 'jwt-token', phoneNumber: '+79991234567' }),
        { status: 200 },
      ),
    );

    const result = await verifyFirebasePhoneCode(firebaseCfg, 'session-abc', '123456');

    expect(result).toEqual({ idToken: 'jwt-token', phoneNumber: '+79991234567' });
    expect(fetch).toHaveBeenCalledWith(
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=test-api-key',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ sessionInfo: 'session-abc', code: '123456' }),
      }),
    );
  });

  it('verifyFirebasePhoneCode: бросает при неверном коде', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'INVALID_CODE' } }), { status: 400 }),
    );

    await expect(verifyFirebasePhoneCode(firebaseCfg, 'session-abc', '000000')).rejects.toThrow(
      /INVALID_CODE/,
    );
  });
});

describe('createNotificationClient firebasePhone', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sendFirebasePhoneVerification: бросает без конфига', async () => {
    const client = createNotificationClient({});

    await expect(
      client.sendFirebasePhoneVerification('+79991234567', 'token'),
    ).rejects.toThrow(/Firebase Phone Auth не сконфигурирован/);
  });

  it('getFirebaseRecaptchaParams: бросает без конфига', async () => {
    const client = createNotificationClient({});

    await expect(client.getFirebaseRecaptchaParams()).rejects.toThrow(
      /Firebase Phone Auth не сконфигурирован/,
    );
  });

  it('sendFirebasePhoneVerification: делегирует в firebase-phone', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ sessionInfo: 'sess-1' }), { status: 200 }),
    );

    const client = createNotificationClient({ firebasePhone: firebaseCfg });
    const result = await client.sendFirebasePhoneVerification('+79991234567', 'token');

    expect(result.sessionInfo).toBe('sess-1');
  });
});

describe('createNotificationClient sendVerificationCode', () => {
  it('бросает без SMTP', async () => {
    const client = createNotificationClient({});

    await expect(
      client.sendVerificationCode({ code: '123456', email: 'a@b.c' }),
    ).rejects.toThrow(/SMTP/);
  });
});
