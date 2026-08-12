import { cn } from '@/lib/utils';
import { useColors } from '@/services/queries/use-colors';

import { ColorSwatch } from './ColorSwatch';

type ColorPickerProps = {
  value: number | null;
  onChange: (colorId: number) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { data: colors, isPending, isError, refetch } = useColors();

  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2 text-sm">Cor preferida</legend>

      {isPending && <p className="text-sm text-muted-text">Carregando as cores…</p>}

      {isError && (
        <div role="alert" className="text-sm">
          <p className="text-bad">Não foi possível carregar as cores.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-1 text-brand underline underline-offset-4"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {colors && (
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => {
            const isSelected = color.id === value;

            return (
              <label
                key={color.id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                  isSelected
                    ? 'border-brand bg-brand-wash text-ink'
                    : 'border-line bg-surface text-muted-text hover:border-brand',
                )}
              >
                <input
                  type="radio"
                  name="colorId"
                  value={color.id}
                  checked={isSelected}
                  onChange={() => {
                    onChange(color.id);
                  }}
                  className="sr-only"
                />
                <ColorSwatch hex={color.hex} desaturated={!isSelected} />
                {color.label}
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
