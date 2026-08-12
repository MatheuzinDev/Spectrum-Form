import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, http, NETWORK_ERROR, UNEXPECTED_ERROR } from './http';

function respondWith(body: unknown, init: ResponseInit = {}) {
  const response =
    body === undefined
      ? new Response(null, init)
      : new Response(JSON.stringify(body), {
          ...init,
          headers: { 'Content-Type': 'application/json', ...init.headers },
        });

  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function apiErrorFrom(promise: Promise<unknown>): Promise<ApiError> {
  const result = await promise.then(
    () => null,
    (error: unknown) => error,
  );

  expect(result).toBeInstanceOf(ApiError);
  return result as ApiError;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('http', () => {
  it('devolve o corpo já desserializado', async () => {
    respondWith([{ id: 1, slug: 'vermelho' }]);

    await expect(http.get('/api/colors')).resolves.toEqual([{ id: 1, slug: 'vermelho' }]);
  });

  it('chama caminho relativo, sem URL de API', async () => {
    const fetchMock = respondWith({});

    await http.get('/api/colors');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/colors');
  });

  it('envia as credenciais de mesma origem', async () => {
    const fetchMock = respondWith({});

    await http.get('/api/clients');

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'same-origin' });
  });

  it('serializa o corpo do POST como JSON', async () => {
    const fetchMock = respondWith({}, { status: 201 });

    await http.post('/api/clients', { cpf: '52998224725' });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: '{"cpf":"52998224725"}',
    });
  });

  it('devolve null quando a resposta é 204', async () => {
    respondWith(undefined, { status: 204 });

    await expect(http.post('/api/auth/login')).resolves.toBeNull();
  });

  it('traduz o contrato de erro da API', async () => {
    respondWith(
      {
        error: {
          code: 'CPF_ALREADY_REGISTERED',
          message: 'CPF já cadastrado',
          fields: { cpf: 'Este CPF já está cadastrado' },
        },
      },
      { status: 409 },
    );

    const error = await apiErrorFrom(http.post('/api/clients', {}));

    expect(error.status).toBe(409);
    expect(error.code).toBe('CPF_ALREADY_REGISTERED');
    expect(error.message).toBe('CPF já cadastrado');
    expect(error.fields).toEqual({ cpf: 'Este CPF já está cadastrado' });
  });

  it('expõe fields vazio quando o erro não traz campos', async () => {
    respondWith(
      { error: { code: 'COLOR_NOT_FOUND', message: 'Cor não encontrada' } },
      { status: 404 },
    );

    const error = await apiErrorFrom(http.post('/api/clients', {}));

    expect(error.fields).toEqual({});
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

    const error = await apiErrorFrom(http.get('/api/colors'));

    expect(error.status).toBe(503);
    expect(error.code).toBe(UNEXPECTED_ERROR);
    expect(error.fields).toEqual({});
  });

  it('traduz falha de rede em ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await apiErrorFrom(http.get('/api/colors'));

    expect(error.status).toBe(0);
    expect(error.code).toBe(NETWORK_ERROR);
  });

  it('serializa o corpo do PATCH como JSON', async () => {
    const fetchMock = respondWith({});

    await http.patch('/api/admin/colors/4', { active: false });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      body: '{"active":false}',
    });
  });
});
