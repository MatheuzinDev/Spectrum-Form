import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Adaptado do arquivo que a CLI copiou, que lia o tema por JavaScript com o
 * `useTheme` do `next-themes` — uma dependência que pressupõe um provider e um
 * framework que este projeto não usa.
 *
 * Aqui o tema é CSS: a paleta troca por `prefers-color-scheme` e por
 * `data-theme` no `index.css`, sem estado no React. O `theme="system"` faz o
 * Sonner seguir a preferência do sistema pelo mesmo critério.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
