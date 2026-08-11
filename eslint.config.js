// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/.turbo/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // Seção 15: sem `any` e sem `@ts-ignore`. O `ts-expect-error` continua
      // permitido com descrição, porque ele falha quando o erro deixa de existir —
      // é o oposto de silenciar sem prazo de validade.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // ─── Fronteiras do hexágono (seção 5.3) ──────────────────────────────────
  // A tabela de camadas deixa de ser convenção e passa a ser verificada. É a
  // razão declarada na seção 15 para manter ESLint em vez de uma ferramenta
  // única, e o único controle automatizado dessas fronteiras agora que não há
  // revisão de código (seção 18.5).

  {
    files: ['apps/api/src/*/domain/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@prisma/client', '@nestjs/*', 'zod', 'ioredis', 'argon2'],
              message:
                'domain não importa infraestrutura — ver seção 5.3. Declare uma porta e implemente-a em infrastructure/.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['apps/api/src/*/application/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@prisma/client', 'ioredis', 'argon2'],
              message: 'application fala com o domínio pelas portas — ver seção 5.3.',
            },
          ],
        },
      ],
    },
  },

  // Fora dos arquivos `orm-*`, nenhum arquivo do módulo importa @prisma/client
  // (seção 5.4). Aqui a regra cobre o hexágono inteiro; os adapters de ORM são
  // reabilitados logo abaixo.
  {
    files: ['apps/api/src/*/infrastructure/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@prisma/client'],
              message: 'só os arquivos orm-* falam com o Prisma — ver seção 5.4.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/api/src/**/*.orm-*.ts', 'apps/api/src/**/orm-*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },

  prettier,
);
