import { z } from 'zod';

/**
 * Uma cor como a API devolve em `GET /api/colors` (seção 7). O `slug` é a chave
 * estável — `label` e `hex` podem ser alterados pela área administrativa.
 */
export const colorSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1).describe('Identificador estável da cor'),
  label: z.string().min(1).describe('Nome exibido ao usuário'),
  hex: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, 'Cor deve estar no formato #RRGGBB')
    .describe('Cor em hexadecimal, no formato #RRGGBB'),
});

/** Resposta de `GET /api/colors`: as ativas, já ordenadas por `sort_order`. */
export const colorListSchema = z.array(colorSchema);

export type Color = z.output<typeof colorSchema>;
