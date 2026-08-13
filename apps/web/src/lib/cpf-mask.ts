import { CPF_LENGTH, onlyDigits } from '@repo/shared';

export function maskCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, CPF_LENGTH);

  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(
    (group) => group.length > 0,
  );

  const checkDigits = digits.slice(9);
  const masked = groups.join('.');

  return checkDigits.length > 0 ? `${masked}-${checkDigits}` : masked;
}
