export const SENSITIVE_FIELDS = [
  'cpf',
  'email',
  'password',
  'passwordHash',
  'authorization',
  'cookie',
  'set-cookie',
  'token',
  'accessToken',
  'refreshToken',
] as const;

export const REDACT_CENSOR = '[REDACTED]';

const NESTING_LEVELS = ['', '*.', '*.*.'];

export const REDACT_PATHS: string[] = NESTING_LEVELS.flatMap((prefix) =>
  SENSITIVE_FIELDS.map((field) =>
    field.includes('-') ? `${prefix}["${field}"]` : `${prefix}${field}`,
  ),
);
