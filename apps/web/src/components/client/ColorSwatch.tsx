import { cn } from '@/lib/utils';

type ColorSwatchProps = {
  hex: string;
  desaturated?: boolean;
  className?: string;
};

export function ColorSwatch({ hex, desaturated = false, className }: ColorSwatchProps) {
  return (
    <span
      aria-hidden="true"
      data-testid="color-swatch"
      className={cn(
        'inline-block size-4 shrink-0 rounded-full ring-1 ring-black/15 transition',
        desaturated && 'saturate-25',
        className,
      )}
      style={{ backgroundColor: hex }}
    />
  );
}
