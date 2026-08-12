import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Junta classes condicionais e resolve conflitos do Tailwind, mantendo a
 * última. Sem o `twMerge`, `cn('p-2', 'p-4')` deixaria as duas no atributo e o
 * resultado dependeria da ordem em que elas aparecem no CSS gerado, não da
 * ordem em que foram escritas.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
