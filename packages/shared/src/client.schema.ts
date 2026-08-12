import { z } from 'zod';

import { colorSchema } from './color.schema';
import { isValidCpf, onlyDigits } from './cpf';

const CPF_LENGTH = 11;

export const createClientSchema = z.object({
  fullName: z.string().trim().min(3).max(120).describe('Nome completo do cliente'),
  cpf: z
    .string()
    .transform(onlyDigits)
    .refine((value) => value.length === CPF_LENGTH, 'CPF deve ter 11 dígitos')
    .refine(isValidCpf, 'CPF inválido')
    .describe('Apenas dígitos, 11 caracteres'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email())
    .describe('E-mail, normalizado para minúsculas'),
  colorId: z.number().int().positive().describe('Id de uma cor ativa'),
  notes: z.string().trim().max(500).optional().describe('Observações livres'),
});

export type CreateClientInput = z.input<typeof createClientSchema>;
export type CreateClientData = z.output<typeof createClientSchema>;

export const clientResponseSchema = z.object({
  id: z.uuid(),
  fullName: z.string(),
  cpf: z.string().length(CPF_LENGTH),
  email: z.email(),
  color: colorSchema,
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const clientPageSchema = z.object({
  data: z.array(clientResponseSchema),
  meta: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type ClientResponse = z.output<typeof clientResponseSchema>;
export type ClientPage = z.output<typeof clientPageSchema>;
