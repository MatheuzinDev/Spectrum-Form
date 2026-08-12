/**
 * Casca mínima da aplicação. É substituída em `feat/web-router`, quando o
 * React Router assume e as rotas da seção 9 passam a existir.
 *
 * As classes aqui existem para provar que o Tailwind está processando os
 * tokens do desenho — é a única verificação possível antes de haver tela.
 */
export function App() {
  return (
    <main className="min-h-dvh bg-paper px-6 py-16 text-ink">
      <h1 className="font-sans text-3xl text-balance">Cadastro de clientes</h1>
      <p className="mt-2 text-muted-text">Em construção. As telas chegam nas próximas etapas.</p>
      <p className="mt-6 font-mono text-sm tabular-nums text-brand">529.982.247-25</p>
    </main>
  );
}
