import { describe, expect, it } from 'vitest';

import { InvalidEnvError, parseEnv } from './env.schema';

function errorFrom(source: Record<string, string | undefined>): InvalidEnvError {
  try {
    parseEnv(source);
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidEnvError);
    return error as InvalidEnvError;
  }

  throw new Error('esperava que parseEnv recusasse esta configuração');
}

describe('parseEnv', () => {
  it('aplica os padrões quando nada é informado', () => {
    expect(parseEnv({})).toEqual({ NODE_ENV: 'development', PORT: 3000 });
  });

  it('converte a porta para número', () => {
    expect(parseEnv({ PORT: '3123' }).PORT).toBe(3123);
  });

  it.each(['abc', '', '80.5'])('recusa a porta %o', (PORT) => {
    expect(() => parseEnv({ PORT })).toThrow(InvalidEnvError);
  });

  it.each(['0', '65536'])('recusa a porta %s, fora da faixa válida', (PORT) => {
    expect(errorFrom({ PORT }).message).toContain('esperado número entre 1 e 65535');
  });

  it('recusa NODE_ENV fora do conjunto', () => {
    expect(errorFrom({ NODE_ENV: 'prod' }).message).toContain(
      'esperado um de development | test | production',
    );
  });

  it.each(['development', 'test', 'production'])('aceita NODE_ENV %s', (NODE_ENV) => {
    expect(parseEnv({ NODE_ENV }).NODE_ENV).toBe(NODE_ENV);
  });

  it('nomeia a variável e mostra o valor recebido', () => {
    const { message } = errorFrom({ PORT: 'abc' });

    expect(message).toContain('Configuração de ambiente inválida:');
    expect(message).toContain('PORT:');
    expect(message).toContain('recebido "abc"');
  });

  it('reporta todas as variáveis inválidas de uma vez', () => {
    const { message } = errorFrom({ PORT: 'abc', NODE_ENV: 'prod' });

    expect(message).toContain('PORT:');
    expect(message).toContain('NODE_ENV:');
  });
});
