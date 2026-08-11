import { describe, expect, it } from 'vitest';

import { colorListSchema, colorSchema } from './color.schema';

const verde = { id: 4, slug: 'verde', label: 'Verde', hex: '#2ecc71' };

describe('colorSchema', () => {
  it('aceita uma cor da seção 7', () => {
    expect(colorSchema.safeParse(verde).success).toBe(true);
  });

  it.each(['#2ECC71', '#000000', '#ffffff'])('aceita o hexadecimal %s', (hex) => {
    expect(colorSchema.safeParse({ ...verde, hex }).success).toBe(true);
  });

  it.each(['2ecc71', '#2ecc7', '#2ecc719', '#gggggg', 'verde'])(
    'recusa o hexadecimal %s',
    (hex) => {
      const resultado = colorSchema.safeParse({ ...verde, hex });
      expect(resultado.success).toBe(false);
    },
  );

  it('recusa id não positivo', () => {
    expect(colorSchema.safeParse({ ...verde, id: 0 }).success).toBe(false);
  });

  it('recusa slug e label vazios', () => {
    expect(colorSchema.safeParse({ ...verde, slug: '' }).success).toBe(false);
    expect(colorSchema.safeParse({ ...verde, label: '' }).success).toBe(false);
  });
});

describe('colorListSchema', () => {
  it('aceita lista vazia — todas as cores podem estar inativas', () => {
    expect(colorListSchema.safeParse([]).success).toBe(true);
  });

  it('recusa quando um item da lista é inválido', () => {
    expect(colorListSchema.safeParse([verde, { ...verde, hex: 'x' }]).success).toBe(false);
  });
});
