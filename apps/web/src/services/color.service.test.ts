import { afterEach, describe, expect, it, vi } from 'vitest';

import { colorsFixture } from '@/tests/fixtures';

import { listColors } from './color.service';
import { http } from './http';

vi.mock('./http');

const httpMock = vi.mocked(http);

afterEach(() => {
  vi.resetAllMocks();
});

describe('listColors', () => {
  it('consulta o endpoint público de cores', async () => {
    httpMock.get.mockResolvedValue(colorsFixture);

    await listColors();

    expect(httpMock.get).toHaveBeenCalledWith('/api/colors');
  });

  it('devolve as cores validadas pelo schema compartilhado', async () => {
    httpMock.get.mockResolvedValue(colorsFixture);

    await expect(listColors()).resolves.toEqual(colorsFixture);
  });

  it('recusa resposta fora do contrato', async () => {
    httpMock.get.mockResolvedValue([
      { id: 1, slug: 'vermelho', label: 'Vermelho', hex: 'vermelho' },
    ]);

    await expect(listColors()).rejects.toThrow();
  });
});
