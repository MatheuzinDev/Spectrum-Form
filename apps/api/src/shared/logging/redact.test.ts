import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Writable } from 'node:stream';
import { beforeEach, describe, expect, it } from 'vitest';

import { REDACT_CENSOR, REDACT_PATHS } from './redact';

type LogLine = Record<string, unknown>;

let lines: LogLine[];
let log: (payload: object, message: string) => void;

beforeEach(() => {
  lines = [];

  const sink = new Writable({
    write(chunk: Buffer, _encoding, done) {
      lines.push(JSON.parse(chunk.toString()) as LogLine);
      done();
    },
  });

  const adapter = new FastifyAdapter({
    logger: {
      redact: { paths: REDACT_PATHS, censor: REDACT_CENSOR },
      stream: sink,
    },
  });

  const logger = adapter.getInstance().log;
  log = (payload, message) => {
    logger.info(payload, message);
  };
});

function lastLine(): LogLine {
  const line = lines.at(-1);

  if (line === undefined) {
    throw new Error('nenhuma linha de log foi registrada');
  }

  return line;
}

describe('redação dos logs', () => {
  it.each(['cpf', 'email', 'password', 'authorization', 'token'])(
    'esconde %s no topo do objeto',
    (field) => {
      log({ [field]: 'segredo' }, 'topo');

      expect(lastLine()[field]).toBe(REDACT_CENSOR);
    },
  );

  it('esconde um nível abaixo', () => {
    log({ client: { cpf: '52998224725', password: 'segredo' } }, 'aninhado');

    expect(lastLine().client).toEqual({ cpf: REDACT_CENSOR, password: REDACT_CENSOR });
  });

  it('esconde dois níveis abaixo', () => {
    log({ result: { admin: { email: 'a@b.com', refreshToken: 'x' } } }, 'dois níveis');

    expect(lastLine().result).toEqual({
      admin: { email: REDACT_CENSOR, refreshToken: REDACT_CENSOR },
    });
  });

  it('esconde cabeçalho com hífen no nome', () => {
    log({ headers: { 'set-cookie': 'sid=1' } }, 'cabeçalho');

    expect(lastLine().headers).toEqual({ 'set-cookie': REDACT_CENSOR });
  });

  it('preserva o que não é sensível, senão o log não serve para nada', () => {
    log({ colorId: 4, fullName: 'Maria Silva', slug: 'verde' }, 'inofensivo');

    expect(lastLine()).toMatchObject({ colorId: 4, fullName: 'Maria Silva', slug: 'verde' });
  });

  it('não alcança o quarto nível de aninhamento, e isso é o limite aceito', () => {
    log({ a: { b: { c: { cpf: '52998224725' } } } }, 'fundo');

    expect(lastLine()).toMatchObject({ a: { b: { c: { cpf: '52998224725' } } } });
  });
});
