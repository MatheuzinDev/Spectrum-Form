import { formatCpf, type ClientResponse } from '@repo/shared';

import { Button } from '@/components/ui/button';

import { ColorSwatch } from './ColorSwatch';

type ClientReceiptProps = {
  client: ClientResponse;
  onStartOver: () => void;
};

export function ClientReceipt({ client, onStartOver }: ClientReceiptProps) {
  const firstName = client.fullName.split(' ', 1).join('');

  return (
    <section role="status" aria-live="polite" className="mt-8">
      <p className="text-sm text-ok">Cadastro enviado</p>
      <h2 className="mt-2 text-2xl">Pronto, {firstName}.</h2>
      <p className="mt-2 text-muted-text">
        Guardamos o que você preencheu. Não é preciso enviar de novo — este CPF já está registrado.
      </p>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border border-line bg-surface p-4 text-sm">
        <dt className="text-muted-text">Nome</dt>
        <dd>{client.fullName}</dd>

        <dt className="text-muted-text">CPF</dt>
        <dd className="font-mono tabular-nums">{formatCpf(client.cpf)}</dd>

        <dt className="text-muted-text">E-mail</dt>
        <dd>{client.email}</dd>

        <dt className="text-muted-text">Cor</dt>
        <dd className="flex items-center gap-2">
          <ColorSwatch hex={client.color.hex} />
          {client.color.label}
        </dd>
      </dl>

      <Button type="button" variant="outline" className="mt-6" onClick={onStartOver}>
        Cadastrar outra pessoa
      </Button>
    </section>
  );
}
