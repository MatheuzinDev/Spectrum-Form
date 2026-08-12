import { describe, expect, it } from 'vitest';

import { colorListSchema, colorSchema } from './color.schema';

const green = { id: 4, slug: 'green', label: 'Verde', hex: '#2ecc71' };

describe('colorSchema', () => {
  it('aceita uma cor da seção 7', () => {
    expect(colorSchema.safeParse(green).success).toBe(true);
  });

  it.each(['#2ECC71', '#000000', '#ffffff'])('aceita o hexadecimal %s', (hex) => {
    expect(colorSchema.safeParse({ ...green, hex }).success).toBe(true);
  });

  it.each(['2ecc71', '#2ecc7', '#2ecc719', '#gggggg', 'green'])(
    'recusa o hexadecimal %s',
    (hex) => {
      const result = colorSchema.safeParse({ ...green, hex });
      expect(result.success).toBe(false);
    },
  );

  it('recusa id não positivo', () => {
    expect(colorSchema.safeParse({ ...green, id: 0 }).success).toBe(false);
  });

  it('recusa slug e label vazios', () => {
    expect(colorSchema.safeParse({ ...green, slug: '' }).success).toBe(false);
    expect(colorSchema.safeParse({ ...green, label: '' }).success).toBe(false);
  });
});

describe('colorListSchema', () => {
  it('aceita lista vazia — todas as cores podem estar inativas', () => {
    expect(colorListSchema.safeParse([]).success).toBe(true);
  });

  it('recusa quando um item da lista é inválido', () => {
    expect(colorListSchema.safeParse([green, { ...green, hex: 'x' }]).success).toBe(false);
  });
});
