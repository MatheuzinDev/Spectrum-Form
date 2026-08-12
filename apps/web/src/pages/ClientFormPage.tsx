import { useState } from 'react';

import { ColorPicker } from '@/components/client/ColorPicker';
import { ColorRule } from '@/components/client/ColorRule';

export function ClientFormPage() {
  const [colorId, setColorId] = useState<number | null>(null);

  return (
    <main className="mx-auto w-full max-w-[34rem] px-6 py-16">
      <ColorRule selectedColorId={colorId} />

      <h1 className="mt-8 text-3xl">Seu cadastro, uma vez só.</h1>
      <p className="mt-2 text-muted-text">
        Cada pessoa se cadastra uma vez: o CPF e o e-mail não se repetem. Leva cinco campos.
      </p>

      <div className="mt-8">
        <ColorPicker value={colorId} onChange={setColorId} />
      </div>
    </main>
  );
}
