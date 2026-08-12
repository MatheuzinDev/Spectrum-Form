import { screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listColors } from '@/services/color.service';
import { colorsFixture } from '@/tests/fixtures';
import { renderWithQuery } from '@/tests/render';

import { routes } from './router';

vi.mock('@/services/color.service');

beforeEach(() => {
  vi.mocked(listColors).mockResolvedValue(colorsFixture);
});

function renderRoute(route: string) {
  return renderWithQuery(
    <RouterProvider router={createMemoryRouter(routes, { initialEntries: [route] })} />,
  );
}

describe('router', () => {
  it.each([
    ['/', 'Seu cadastro, uma vez só.'],
    ['/admin/login', 'Entrar no painel'],
    ['/admin', 'Painel'],
    ['/admin/clients', 'Cadastros'],
    ['/admin/colors', 'Cores'],
  ])('%s renderiza "%s"', async (route, title) => {
    renderRoute(route);

    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  it('mostra a navegação administrativa nas telas do painel', async () => {
    renderRoute('/admin/clients');

    expect(await screen.findByRole('navigation', { name: 'Área administrativa' })).toBeVisible();
  });

  it('não mostra a navegação administrativa na tela de login', async () => {
    renderRoute('/admin/login');

    await screen.findByRole('heading', { level: 1, name: 'Entrar no painel' });
    expect(screen.queryByRole('navigation', { name: 'Área administrativa' })).toBeNull();
  });

  it('cai no 404 em caminho inexistente', async () => {
    renderRoute('/route-que-nao-existe');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeInTheDocument();
  });
});
