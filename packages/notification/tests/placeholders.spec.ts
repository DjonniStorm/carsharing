import { describe, expect, it } from 'vitest';

import { substitutePlaceholders } from '../src/placeholders.js';

describe('substitutePlaceholders', () => {
  const vars = { to: '+7999', body: 'Привет' };

  it('заменяет плейсхолдеры в строке', () => {
    expect(substitutePlaceholders('to={{to}} msg={{body}}', vars)).toBe('to=+7999 msg=Привет');
  });

  it('обходит вложенные объекты и массивы', () => {
    const input = {
      phones: ['{{to}}'],
      meta: { text: '{{body}}', n: 1 },
    };
    expect(substitutePlaceholders(input, vars)).toEqual({
      phones: ['+7999'],
      meta: { text: 'Привет', n: 1 },
    });
  });

  it('не трогает числа и boolean', () => {
    expect(substitutePlaceholders({ x: 42, y: true }, vars)).toEqual({
      x: 42,
      y: true,
    });
  });
});
