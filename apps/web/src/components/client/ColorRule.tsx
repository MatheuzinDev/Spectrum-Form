import { useColors } from '@/services/queries/use-colors';

type ColorRuleProps = {
  selectedColorId: number | null;
};

export function ColorRule({ selectedColorId }: ColorRuleProps) {
  const { data: colors } = useColors();

  if (!colors || colors.length === 0) {
    return null;
  }

  const selected = colors.find((color) => color.id === selectedColorId);
  const bands = selected ? [selected] : colors;

  return (
    <div aria-hidden="true" className="flex h-1.5 w-full overflow-hidden rounded-full">
      {bands.map((color) => (
        <span key={color.id} className="h-full flex-1" style={{ backgroundColor: color.hex }} />
      ))}
    </div>
  );
}
