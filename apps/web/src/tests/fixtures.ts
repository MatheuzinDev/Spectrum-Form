import { colorListSchema, type Color } from '@repo/shared';

export const colorsFixture: Color[] = colorListSchema.parse([
  { id: 1, slug: 'vermelho', label: 'Vermelho', hex: '#e74c3c' },
  { id: 2, slug: 'laranja', label: 'Laranja', hex: '#e67e22' },
  { id: 3, slug: 'amarelo', label: 'Amarelo', hex: '#f1c40f' },
  { id: 4, slug: 'verde', label: 'Verde', hex: '#2ecc71' },
  { id: 5, slug: 'azul', label: 'Azul', hex: '#3498db' },
  { id: 6, slug: 'anil', label: 'Anil', hex: '#4c5fbf' },
  { id: 7, slug: 'violeta', label: 'Violeta', hex: '#8e44ad' },
]);
