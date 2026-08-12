/**
 * Listagem dos cadastros, somente leitura. A tela real chega em
 * `feat/web-admin-clients`, com TanStack Table, busca e filtro por cor.
 *
 * Não há edição nem exclusão: o administrador lê `clients` e escreve apenas em
 * `colors`.
 */
export function ClientListPage() {
  return (
    <section>
      <h1 className="text-3xl">Cadastros</h1>
    </section>
  );
}
