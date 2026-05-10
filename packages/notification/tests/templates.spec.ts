import { describe, expect, it } from 'vitest';

import { buildVerificationEmail } from '../src/templates/verification-templates.js';
import { buildViolationNoticeEmail } from '../src/templates/violation-templates.js';

describe('templates', () => {
  it('verification email содержит код и экранирует HTML', () => {
    const { subject, text, html } = buildVerificationEmail('102<9');
    expect(subject).toContain('Код');
    expect(text).toContain('102<9');
    expect(html).toContain('102&lt;9');
    expect(html).toContain('Carsharing');
  });

  it('violation email содержит заголовок и описание', () => {
    const { subject, html } = buildViolationNoticeEmail({
      title: 'Превышение скорости',
      description: '110 км/ч при лимите 90',
      tripId: 'uuid-1',
      occurredAt: new Date('2026-05-01T12:00:00.000Z'),
    });
    expect(subject).toContain('Превышение');
    expect(html).toContain('110 км/ч');
    expect(html).toContain('uuid-1');
  });
});
