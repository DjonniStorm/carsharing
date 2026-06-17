import { describe, expect, it } from 'vitest';

import { createNotificationClient } from '../src/client.js';

describe('createNotificationClient sendVerificationCode', () => {
  it('бросает без SMTP при попытке отправить код на email', async () => {
    const client = createNotificationClient({});

    await expect(
      client.sendVerificationCode({ code: '123456', email: 'user@example.com' }),
    ).rejects.toThrow(/SMTP/);
  });
});
