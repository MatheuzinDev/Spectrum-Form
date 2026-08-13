import type { CreateClientData } from '@repo/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clientResponseFixture } from '@/tests/fixtures';

import { createClient } from './client.service';
import { http } from './http';

vi.mock('./http');

const httpMock = vi.mocked(http);

const input: CreateClientData = {
  fullName: 'Maria Silva',
  cpf: '12345678909',
  email: 'maria@exemplo.com',
  colorId: 4,
  notes: 'Cliente preferencial',
};

afterEach(() => {
  vi.resetAllMocks();
});

describe('createClient', () => {
  it('envia o cadastro para o endpoint público', async () => {
    httpMock.post.mockResolvedValue(clientResponseFixture(input));

    await createClient(input);

    expect(httpMock.post).toHaveBeenCalledWith('/api/clients', input);
  });

  it('devolve o cadastro validado pelo schema compartilhado', async () => {
    const created = clientResponseFixture(input);
    httpMock.post.mockResolvedValue(created);

    await expect(createClient(input)).resolves.toEqual(created);
  });

  it('recusa resposta fora do contrato', async () => {
    httpMock.post.mockResolvedValue({ ...clientResponseFixture(input), cpf: '529.982.247-25' });

    await expect(createClient(input)).rejects.toThrow();
  });
});
