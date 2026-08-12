import { createBrowserRouter, type RouteObject } from 'react-router';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ClientFormPage } from '@/pages/ClientFormPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ClientListPage } from '@/pages/admin/ClientListPage';
import { ColorListPage } from '@/pages/admin/ColorListPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { LoginPage } from '@/pages/admin/LoginPage';

/**
 * As cinco rotas da especificação, mais a curinga.
 *
 * **Sem `loader` em nenhuma delas, e isso é decisão.** O React Router oferece
 * busca de dados por rota; o TanStack Query já é a escolha do projeto para
 * isso. O router cuida de caminho, aninhamento e fronteira de erro — os dados
 * vêm sempre da mesma camada. Duas formas de buscar não aparecem por decisão:
 * aparecem quando alguém acha mais prático carregar algo num `loader`, e a
 * partir daí há dois caches que não se conhecem.
 *
 * A lista fica exportada porque o teste monta um `createMemoryRouter` sobre
 * ela — o que é testado é esta configuração, não uma cópia parecida.
 */
export const routes: RouteObject[] = [
  { path: '/', element: <ClientFormPage /> },

  // Fora do AdminLayout de propósito: a navegação do painel não pode aparecer
  // para quem ainda não entrou.
  { path: '/admin/login', element: <LoginPage /> },

  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'clients', element: <ClientListPage /> },
      { path: 'colors', element: <ColorListPage /> },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
