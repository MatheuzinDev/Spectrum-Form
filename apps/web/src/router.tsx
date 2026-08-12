import { createBrowserRouter, type RouteObject } from 'react-router';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ClientFormPage } from '@/pages/ClientFormPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ClientListPage } from '@/pages/admin/ClientListPage';
import { ColorListPage } from '@/pages/admin/ColorListPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { LoginPage } from '@/pages/admin/LoginPage';

export const routes: RouteObject[] = [
  { path: '/', element: <ClientFormPage /> },

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
