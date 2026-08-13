import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
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

  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  {
    files: ['apps/web/src/**/*.tsx'],
    ignores: [
      'apps/web/src/**/*.test.tsx',
      'apps/web/src/tests/**',
      'apps/web/src/components/ui/**',
    ],
    extends: [reactRefresh.configs.vite],
  },

  prettier,
);
