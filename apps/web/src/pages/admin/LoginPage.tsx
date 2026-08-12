/**
 * Entrada da área administrativa. Fica **fora** do `AdminLayout`: a navegação
 * do painel não pode aparecer para quem ainda não entrou.
 *
 * A tela real chega em `feat/web-auth`, junto do interceptor de `401`.
 */
export function LoginPage() {
  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-3xl">Entrar no painel</h1>
    </main>
  );
}
