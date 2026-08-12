import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl">Página não encontrada</h1>
      <p className="mt-2 text-muted-text">
        O endereço não corresponde a nenhuma tela desta aplicação.
      </p>
      <Link to="/" className="mt-6 inline-block text-brand underline underline-offset-4">
        Ir para o formulário
      </Link>
    </main>
  );
}
