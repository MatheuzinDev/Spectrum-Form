/**
 * Gestão das cores, inclusive as inativas — o público só enxerga as ativas.
 * A tela real chega em `feat/web-admin-colors`.
 *
 * É a única área do painel com escrita, e é ela que fecha o ciclo aberto pela
 * decisão de que acrescentar cor é um `INSERT`, não um deploy.
 */
export function ColorListPage() {
  return (
    <section>
      <h1 className="text-3xl">Cores</h1>
    </section>
  );
}
