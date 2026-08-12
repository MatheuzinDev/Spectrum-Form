import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, http, NETWORK_ERROR, UNEXPECTED_ERROR } from './http';

function responderCom(body: unknown, init: ResponseInit = {}) {
  const resposta =
    body === undefined
      ? new Response(null, init)
      : new Response(JSON.stringify(body), {
          ...init,
          headers: { 'Content-Type': 'application/json', ...init.headers },
        });

  const fetchFalso = vi.fn().mockResolvedValue(resposta);
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

async function erroDe(promessa: Promise<unknown>): Promise<ApiError> {
  const resultado = await promessa.then(
    () => null,
    (erro: unknown) => erro,
  );

  expect(resultado).toBeInstanceOf(ApiError);
  return resultado as ApiError;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('http', () => {
  it('devolve o corpo já desserializado', async () => {
    responderCom([{ id: 1, slug: 'vermelho' }]);

    await expect(http.get('/api/colors')).resolves.toEqual([{ id: 1, slug: 'vermelho' }]);
  });

  it('chama caminho relativo, sem URL de API', async () => {
    const fetchFalso = responderCom({});

    await http.get('/api/colors');

    expect(fetchFalso.mock.calls[0]?.[0]).toBe('/api/colors');
  });

  it('envia as credenciais de mesma origem', async () => {
    const fetchFalso = responderCom({});

    await http.get('/api/clients');

    expect(fetchFalso.mock.calls[0]?.[1]).toMatchObject({ credentials: 'same-origin' });
  });

  it('serializa o corpo do POST como JSON', async () => {
    const fetchFalso = responderCom({}, { status: 201 });

    await http.post('/api/clients', { cpf: '52998224725' });

    expect(fetchFalso.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: '{"cpf":"52998224725"}',
    });
  });

  it('devolve null quando a resposta é 204', async () => {
    responderCom(undefined, { status: 204 });

    await expect(http.post('/api/auth/login')).resolves.toBeNull();
  });

  it('traduz o contrato de erro da API', async () => {
    responderCom(
      {
        error: {
          code: 'CPF_ALREADY_REGISTERED',
          message: 'CPF já cadastrado',
          fields: { cpf: 'Este CPF já está cadastrado' },
        },
      },
      { status: 409 },
    );

    const erro = await erroDe(http.post('/api/clients', {}));

    expect(erro.status).toBe(409);
    expect(erro.code).toBe('CPF_ALREADY_REGISTERED');
    expect(erro.message).toBe('CPF já cadastrado');
    expect(erro.fields).toEqual({ cpf: 'Este CPF já está cadastrado' });
  });

  it('expõe fields vazio quando o erro não traz campos', async () => {
    responderCom(
      { error: { code: 'COLOR_NOT_FOUND', message: 'Cor não encontrada' } },
      { status: 404 },
    );

    const erro = await erroDe(http.post('/api/clients', {}));

    expect(erro.fields).toEqual({});
  });

  it('não quebra quando a resposta de erro não segue o contrato', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>503 Service Temporarily Unavailable</html>', {
          status: 503,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    const erro = await erroDe(http.get('/api/colors'));

    expect(erro.status).toBe(503);
    expect(erro.code).toBe(UNEXPECTED_ERROR);
    expect(erro.fields).toEqual({});
  });

  it('traduz falha de rede em ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const erro = await erroDe(http.get('/api/colors'));

    expect(erro.status).toBe(0);
    expect(erro.code).toBe(NETWORK_ERROR);
  });

  it('serializa o corpo do PATCH como JSON', async () => {
    const fetchFalso = responderCom({});

    await http.patch('/api/admin/colors/4', { active: false });

    expect(fetchFalso.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      body: '{"active":false}',
    });
  });
});
