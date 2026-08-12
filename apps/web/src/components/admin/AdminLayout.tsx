import { NavLink, Outlet } from 'react-router';

import { cn } from '@/lib/utils';

const links = [
  { to: '/admin', label: 'Painel', end: true },
  { to: '/admin/clients', label: 'Cadastros', end: false },
  { to: '/admin/colors', label: 'Cores', end: false },
];

export function AdminLayout() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <nav aria-label="Área administrativa" className="flex gap-4">
            {links.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'text-sm underline-offset-4 hover:underline',
                    isActive ? 'text-brand' : 'text-muted-text',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Encerrar a sessão exige sessão. O botão entra em feat/web-auth. */}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
