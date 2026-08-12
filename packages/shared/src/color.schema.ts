import { z } from 'zod';

export const colorSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1).describe('Identificador estável da cor'),
  label: z.string().min(1).describe('Nome exibido ao usuário'),
  hex: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, 'Cor deve estar no formato #RRGGBB')
    .describe('Cor em hexadecimal, no formato #RRGGBB'),
});

export const colorListSchema = z.array(colorSchema);

export type Color = z.output<typeof colorSchema>;
