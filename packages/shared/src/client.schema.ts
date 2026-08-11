import { z } from 'zod';

import { colorSchema } from './color.schema';
import { isValidCpf, onlyDigits } from './cpf';

const CPF_LENGTH = 11;

/**
 * Entrada de `POST /api/clients`. Fonte única de verdade da ADR-03: o mesmo
 * schema valida no React via `zodResolver`, valida no servidor via
 * `createZodDto` e gera a spec OpenAPI.
 *
 * Pela ADR-10, aqui se valida **formato**. O que depende de estado — unicidade
 * de CPF, existência de uma cor ativa — é invariante de domínio e não cabe
 * neste arquivo.
 */
export const createClientSchema = z.object({
  fullName: z.string().trim().min(3).max(120).describe('Nome completo do cliente'),
  cpf: z
    .string()
    .transform(onlyDigits)
    .refine((value) => value.length === CPF_LENGTH, 'CPF deve ter 11 dígitos')
    .refine(isValidCpf, 'CPF inválido')
    .describe('Apenas dígitos, 11 caracteres'),
  // A ordem importa e não é a do snippet da seção 8, escrito para o Zod 3. No
  // Zod 4 o `z.email()` é um schema próprio e valida antes de qualquer
  // transformação encadeada depois dele: `  MARIA@X.COM  ` seria recusado sem
  // nunca ter sido normalizado. O `pipe` restabelece a sequência — normaliza,
  // depois valida.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email())
    .describe('E-mail, normalizado para minúsculas'),
  colorId: z.number().int().positive().describe('Id de uma cor ativa'),
  notes: z.string().trim().max(500).optional().describe('Observações livres'),
});

/**
 * Os dois lados do `.transform()`.
 *
 * `CreateClientInput` é o que o formulário digita — o CPF ainda com máscara.
 * `CreateClientData` é o que sai da validação, com o CPF já reduzido a dígitos,
 * e é o que o caso de uso recebe.
 *
 * **Hoje os dois são estruturalmente idênticos**, porque `onlyDigits` é
 * `string → string`: o compilador não impede trocar um pelo outro, e a
 * distinção é de intenção, não de tipo. Ela passa a ter efeito real no dia em
 * que alguma transformação mudar a forma — um `colorId` que chega como string
 * do `<select>` e sai como número, por exemplo. Os nomes existem para que a
 * fronteira da ADR-10 fique legível nas assinaturas até lá.
 */
export type CreateClientInput = z.input<typeof createClientSchema>;
export type CreateClientData = z.output<typeof createClientSchema>;

/**
 * Um cadastro como a API devolve, com a cor aninhada (seção 7). O CPF sai com
 * os onze dígitos, sem máscara: quem formata para exibir é o front, com o
 * `formatCpf`.
 */
export const clientResponseSchema = z.object({
  id: z.uuid(),
  fullName: z.string(),
  cpf: z.string().length(CPF_LENGTH),
  email: z.email(),
  color: colorSchema,
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

/** Resposta paginada de `GET /api/clients` (seção 7). */
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
