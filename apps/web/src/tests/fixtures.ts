import {
  clientResponseSchema,
  colorListSchema,
  type ClientResponse,
  type Color,
  type CreateClientData,
} from '@repo/shared';

export const colorsFixture: Color[] = colorListSchema.parse([
  { id: 1, slug: 'vermelho', label: 'Vermelho', hex: '#e74c3c' },
  { id: 2, slug: 'laranja', label: 'Laranja', hex: '#e67e22' },
  { id: 3, slug: 'amarelo', label: 'Amarelo', hex: '#f1c40f' },
  { id: 4, slug: 'verde', label: 'Verde', hex: '#2ecc71' },
  { id: 5, slug: 'azul', label: 'Azul', hex: '#3498db' },
  { id: 6, slug: 'anil', label: 'Anil', hex: '#4c5fbf' },
  { id: 7, slug: 'violeta', label: 'Violeta', hex: '#8e44ad' },
]);

const FALLBACK_COLOR: Color = { id: 4, slug: 'verde', label: 'Verde', hex: '#2ecc71' };

export function clientResponseFixture(input: CreateClientData): ClientResponse {
  const color = colorsFixture.find((candidate) => candidate.id === input.colorId) ?? FALLBACK_COLOR;

  return clientResponseSchema.parse({
    id: '9c8f1e2a-4b7d-4c1e-8a2f-0d3e5f6a7b8c',
    fullName: input.fullName,
    cpf: input.cpf,
    email: input.email,
    color,
    notes: input.notes ?? null,
    createdAt: new Date().toISOString(),
  });
}
