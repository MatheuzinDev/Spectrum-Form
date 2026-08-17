import { describe, expect, it } from 'vitest';

import { toAppConfig } from './app.config';

describe('toAppConfig', () => {
  it('expõe as variáveis com nomes tipados', () => {
    expect(toAppConfig({ NODE_ENV: 'development', PORT: 3123 })).toMatchObject({
      nodeEnv: 'development',
      port: 3123,
    });
  });

  it.each([
    ['production', true],
    ['development', false],
    ['test', false],
  ] as const)('deriva isProduction de NODE_ENV %s', (NODE_ENV, expected) => {
    expect(toAppConfig({ NODE_ENV, PORT: 3000 }).isProduction).toBe(expected);
  });
});
