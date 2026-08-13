import type { ClientResponse } from '@repo/shared';
import { useCallback, useState } from 'react';

import { ClientForm } from '@/components/client/ClientForm';
import { ClientReceipt } from '@/components/client/ClientReceipt';
import { ColorRule } from '@/components/client/ColorRule';

export function ClientFormPage() {
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [created, setCreated] = useState<ClientResponse | null>(null);

  const handleColorChange = useCallback((colorId: number | null) => {
    setSelectedColorId(colorId);
  }, []);

  return (
    <main className="mx-auto w-full max-w-[34rem] px-6 py-16">
      <header className="flex items-center justify-between text-sm">
        <span>
          Registro <span className="text-muted-text">de clientes</span>
        </span>
        <span className="text-muted-text">Leva um minuto</span>
      </header>

      <div className="mt-6">
        <ColorRule selectedColorId={created?.color.id ?? selectedColorId} />
      </div>

      <h1 className="mt-8 text-3xl">Seu cadastro, uma vez só.</h1>
      <p className="mt-2 text-muted-text">
        Cada pessoa se cadastra uma vez: o CPF e o e-mail não se repetem. Leva cinco campos.
      </p>

      {created ? (
        <ClientReceipt
          client={created}
          onStartOver={() => {
            setCreated(null);
            setSelectedColorId(null);
          }}
        />
      ) : (
        <ClientForm onCreated={setCreated} onColorChange={handleColorChange} />
      )}
    </main>
  );
}
