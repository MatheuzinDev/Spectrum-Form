import { describe, expect, it } from 'vitest';

import { clientResponseSchema, createClientSchema } from './client.schema';

const valido = {
  fullName: 'Maria Silva',
  cpf: '52998224725',
  email: 'maria@exemplo.com',
  colorId: 4,
  notes: 'Cliente preferencial',
};

function erroDe(input: unknown, campo: string): string | undefined {
  const resultado = createClientSchema.safeParse(input);
  if (resultado.success) return undefined;
  return resultado.error.issues.find((issue) => issue.path[0] === campo)?.message;
}

describe('createClientSchema', () => {
  it('aceita um cadastro completo', () => {
    expect(createClientSchema.safeParse(valido).success).toBe(true);
  });

  it('aceita sem notes, que é opcional', () => {
    const { notes: _notes, ...semNotas } = valido;
    expect(createClientSchema.safeParse(semNotas).success).toBe(true);
  });

  describe('cpf', () => {
    it('reduz a máscara a dígitos na saída', () => {
      const resultado = createClientSchema.parse({ ...valido, cpf: '529.982.247-25' });
      expect(resultado.cpf).toBe('52998224725');
    });

    it('recusa quando não há onze dígitos', () => {
      expect(erroDe({ ...valido, cpf: '5299822472' }, 'cpf')).toBe('CPF deve ter 11 dígitos');
    });

    it('recusa dígito verificador inválido', () => {
      expect(erroDe({ ...valido, cpf: '52998224726' }, 'cpf')).toBe('CPF inválido');
    });

    it('recusa sequência de dígitos repetidos', () => {
      expect(erroDe({ ...valido, cpf: '11111111111' }, 'cpf')).toBe('CPF inválido');
    });
  });

  describe('email', () => {
    it('normaliza para minúsculas e sem espaços', () => {
      const resultado = createClientSchema.parse({ ...valido, email: '  MARIA@Exemplo.COM  ' });
      expect(resultado.email).toBe('maria@exemplo.com');
    });

    it('recusa e-mail malformado', () => {
      expect(erroDe({ ...valido, email: 'maria@' }, 'email')).toBeDefined();
    });
  });

  describe('fullName', () => {
    it('recusa com menos de 3 caracteres', () => {
      expect(erroDe({ ...valido, fullName: 'Ma' }, 'fullName')).toBeDefined();
    });

    it('recusa com mais de 120 caracteres', () => {
      expect(erroDe({ ...valido, fullName: 'a'.repeat(121) }, 'fullName')).toBeDefined();
    });

    it('remove espaços das pontas', () => {
      expect(createClientSchema.parse({ ...valido, fullName: '  Maria Silva  ' }).fullName).toBe(
        'Maria Silva',
      );
    });
  });

  describe('colorId', () => {
    it.each([0, -1, 1.5])('recusa %s', (colorId) => {
      expect(erroDe({ ...valido, colorId }, 'colorId')).toBeDefined();
    });
  });

  describe('notes', () => {
    it('recusa com mais de 500 caracteres', () => {
      expect(erroDe({ ...valido, notes: 'a'.repeat(501) }, 'notes')).toBeDefined();
    });
  });
});

describe('clientResponseSchema', () => {
  const resposta = {
    id: '9c8f1e2a-4b7d-4c1e-8a2f-0d3e5f6a7b8c',
    fullName: 'Maria Silva',
    cpf: '52998224725',
    email: 'maria@exemplo.com',
    color: { id: 4, slug: 'verde', label: 'Verde', hex: '#2ecc71' },
    notes: 'Cliente preferencial',
    createdAt: '2026-08-03T14:22:10.000Z',
  };

  it('aceita a resposta da seção 7', () => {
    expect(clientResponseSchema.safeParse(resposta).success).toBe(true);
  });

  it('aceita notes nulo', () => {
    expect(clientResponseSchema.safeParse({ ...resposta, notes: null }).success).toBe(true);
  });

  it('recusa CPF com máscara', () => {
    expect(clientResponseSchema.safeParse({ ...resposta, cpf: '529.982.247-25' }).success).toBe(
      false,
    );
  });
});
