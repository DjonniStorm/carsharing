import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createNotificationClient } from '../src/client.js';

describe('createNotificationClient sendSms', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POST: подставляет поля в JSON и вызывает fetch', async () => {
    const client = createNotificationClient({
      sms: {
        url: 'https://sms.example/api',
        method: 'POST',
        jsonBody: { phone: '{{to}}', message: '{{body}}' },
      },
    });

    await client.sendSms({ to: '+79001234567', body: 'Код 1234' });

    expect(fetch).toHaveBeenCalledWith(
      'https://sms.example/api',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+79001234567',
          message: 'Код 1234',
        }),
      }),
    );
  });

  it('GET: добавляет query из searchParams', async () => {
    const client = createNotificationClient({
      sms: {
        url: 'https://sms.example/send',
        method: 'GET',
        searchParams: { to: '{{to}}', text: '{{body}}' },
      },
    });

    await client.sendSms({ to: '7900', body: 'x' });

    expect(fetch).toHaveBeenCalledWith(
      'https://sms.example/send?to=7900&text=x',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('бросает при HTTP ошибке', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('fail', { status: 500 }),
    );

    const client = createNotificationClient({
      sms: {
        url: 'https://sms.example/x',
        method: 'POST',
        jsonBody: { m: '{{body}}' },
      },
    });

    await expect(
      client.sendSms({ to: '1', body: '2' }),
    ).rejects.toThrow(/Ошибка HTTP при отправке SMS/);
  });
});
