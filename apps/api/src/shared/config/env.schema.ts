import { z } from 'zod';

export const NODE_ENVS = ['development', 'test', 'production'] as const;

const MIN_PORT = 1;
const MAX_PORT = 65535;
const DEFAULT_PORT = 3000;

const PORT_RANGE_MESSAGE = `esperado número entre ${MIN_PORT} e ${MAX_PORT}`;

export const envSchema = z.object({
  NODE_ENV: z
    .enum(NODE_ENVS, { error: `esperado um de ${NODE_ENVS.join(' | ')}` })
    .default('development'),
  PORT: z.coerce
    .number({ error: 'esperado um número' })
    .int('esperado um número inteiro')
    .min(MIN_PORT, PORT_RANGE_MESSAGE)
    .max(MAX_PORT, PORT_RANGE_MESSAGE)
    .default(DEFAULT_PORT),
});

export type Env = z.output<typeof envSchema>;

export class InvalidEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEnvError';
  }
}

function describe(issue: z.core.$ZodIssue, source: Record<string, string | undefined>): string {
  const name = String(issue.path[0] ?? '(raiz)');
  const received = source[name];

  const suffix =
    received === undefined ? 'e nada foi informado' : `recebido ${JSON.stringify(received)}`;

  return `  ${name}: ${issue.message}, ${suffix}`;
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);

  if (result.success) {
    return result.data;
  }

  const lines = result.error.issues.map((issue) => describe(issue, source));

  throw new InvalidEnvError(['Configuração de ambiente inválida:', ...lines].join('\n'));
}
