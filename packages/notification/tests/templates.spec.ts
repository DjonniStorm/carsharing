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
    const { subject, html, text } = buildViolationNoticeEmail({
      title: 'Превышение скорости',
      description: '110 км/ч при лимите 90',
      tripId: 'uuid-1',
      occurredAt: new Date('2026-05-01T12:00:00.000Z'),
    });
    expect(subject).toContain('Превышение');
    expect(html).toContain('110 км/ч');
    expect(html).toContain('uuid-1');
    expect(text).toContain('Тема уведомления:');
  });

  it('violation email: сводка по типам и общее количество', () => {
    const { text, html } = buildViolationNoticeEmail({
      title: 'Сообщение менеджера',
      description: 'Текст',
      violationSummary: {
        total: 3,
        byKind: [
          { kind: 1, count: 2 },
          { kind: 4, count: 1 },
        ],
      },
    });
    expect(text).toContain('Всего нарушений в этом уведомлении: 3');
    expect(text).toContain('Превышение скорости: 2');
    expect(text).toContain('Низкий уровень топлива: 1');
    expect(html).toContain('Всего: <strong>3</strong>');
    expect(html).toContain('Превышение скорости');
    expect(html).toContain('Низкий уровень топлива');
  });
});
