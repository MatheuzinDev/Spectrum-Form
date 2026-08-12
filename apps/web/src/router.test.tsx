import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { routes } from './router';

/** Monta as rotas de produção em memória, na URL pedida. */
function renderRota(rota: string) {
  return render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [rota] })} />);
}

describe('router', () => {
  it.each([
    ['/', 'Seu cadastro, uma vez só.'],
    ['/admin/login', 'Entrar no painel'],
    ['/admin', 'Painel'],
    ['/admin/clients', 'Cadastros'],
    ['/admin/colors', 'Cores'],
  ])('%s renderiza "%s"', async (rota, titulo) => {
    renderRota(rota);

    expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeInTheDocument();
  });

  it('mostra a navegação administrativa nas telas do painel', async () => {
    renderRota('/admin/clients');

    expect(await screen.findByRole('navigation', { name: 'Área administrativa' })).toBeVisible();
  });

  // A tela de login é a única rota sob /admin que fica fora do AdminLayout:
  // mostrar a navegação do painel para quem ainda não entrou seria oferecer
  // atalhos para telas que ela não pode ver.
  it('não mostra a navegação administrativa na tela de login', async () => {
    renderRota('/admin/login');

    await screen.findByRole('heading', { level: 1, name: 'Entrar no painel' });
    expect(screen.queryByRole('navigation', { name: 'Área administrativa' })).toBeNull();
  });

  // Com o try_files do NGINX, qualquer caminho carrega a aplicação. Sem a rota
  // curinga, o usuário receberia uma tela em branco em vez de um erro.
  it('cai no 404 em caminho inexistente', async () => {
    renderRota('/rota-que-nao-existe');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeInTheDocument();
  });
});
