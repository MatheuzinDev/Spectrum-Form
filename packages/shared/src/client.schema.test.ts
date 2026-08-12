import { describe, expect, it } from 'vitest';

import { clientResponseSchema, createClientSchema } from './client.schema';

const validInput = {
  fullName: 'Maria Silva',
  cpf: '52998224725',
  email: 'maria@exemplo.com',
  colorId: 4,
  notes: 'Cliente preferencial',
};

function errorFor(input: unknown, field: string): string | undefined {
  const result = createClientSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('createClientSchema', () => {
  it('aceita um cadastro completo', () => {
    expect(createClientSchema.safeParse(validInput).success).toBe(true);
  });

  it('aceita sem notes, que é opcional', () => {
    const { notes: _notes, ...withoutNotes } = validInput;
    expect(createClientSchema.safeParse(withoutNotes).success).toBe(true);
  });

  describe('cpf', () => {
    it('reduz a máscara a dígitos na saída', () => {
      const result = createClientSchema.parse({ ...validInput, cpf: '529.982.247-25' });
      expect(result.cpf).toBe('52998224725');
    });

    it('recusa quando não há onze dígitos', () => {
      expect(errorFor({ ...validInput, cpf: '5299822472' }, 'cpf')).toBe('CPF deve ter 11 dígitos');
    });

    it('recusa dígito verificador inválido', () => {
      expect(errorFor({ ...validInput, cpf: '52998224726' }, 'cpf')).toBe('CPF inválido');
    });

    it('recusa sequência de dígitos repetidos', () => {
      expect(errorFor({ ...validInput, cpf: '11111111111' }, 'cpf')).toBe('CPF inválido');
    });
  });

  describe('email', () => {
    it('normaliza para minúsculas e sem espaços', () => {
      const result = createClientSchema.parse({ ...validInput, email: '  MARIA@Exemplo.COM  ' });
      expect(result.email).toBe('maria@exemplo.com');
    });

    it('recusa e-mail malformado', () => {
      expect(errorFor({ ...validInput, email: 'maria@' }, 'email')).toBeDefined();
    });
  });

  describe('fullName', () => {
    it('recusa com menos de 3 caracteres', () => {
      expect(errorFor({ ...validInput, fullName: 'Ma' }, 'fullName')).toBeDefined();
    });

    it('recusa com mais de 120 caracteres', () => {
      expect(errorFor({ ...validInput, fullName: 'a'.repeat(121) }, 'fullName')).toBeDefined();
    });

    it('remove espaços das pontas', () => {
      expect(
        createClientSchema.parse({ ...validInput, fullName: '  Maria Silva  ' }).fullName,
      ).toBe('Maria Silva');
    });
  });

  describe('colorId', () => {
    it.each([0, -1, 1.5])('recusa %s', (colorId) => {
      expect(errorFor({ ...validInput, colorId }, 'colorId')).toBeDefined();
    });
  });

  describe('notes', () => {
    it('recusa com mais de 500 caracteres', () => {
      expect(errorFor({ ...validInput, notes: 'a'.repeat(501) }, 'notes')).toBeDefined();
    });
  });
});

describe('clientResponseSchema', () => {
  const response = {
    id: '9c8f1e2a-4b7d-4c1e-8a2f-0d3e5f6a7b8c',
    fullName: 'Maria Silva',
    cpf: '52998224725',
    email: 'maria@exemplo.com',
    color: { id: 4, slug: 'verde', label: 'Verde', hex: '#2ecc71' },
    notes: 'Cliente preferencial',
    createdAt: '2026-08-03T14:22:10.000Z',
  };

  it('aceita a resposta da seção 7', () => {
    expect(clientResponseSchema.safeParse(response).success).toBe(true);
  });

  it('aceita notes nulo', () => {
    expect(clientResponseSchema.safeParse({ ...response, notes: null }).success).toBe(true);
  });

  it('recusa CPF com máscara', () => {
    expect(clientResponseSchema.safeParse({ ...response, cpf: '529.982.247-25' }).success).toBe(
      false,
    );
  });
});
