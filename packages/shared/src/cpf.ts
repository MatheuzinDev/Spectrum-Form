const CPF_LENGTH = 11;

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCpf(value: string): string {
  const cpf = onlyDigits(value);

  if (cpf.length !== CPF_LENGTH) {
    return value;
  }

  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

function checkDigit(digits: readonly number[], weightStart: number): number {
  const sum = digits.reduce((total, digit, index) => total + digit * (weightStart - index), 0);
  const remainder = sum % CPF_LENGTH;

  return remainder < 2 ? 0 : CPF_LENGTH - remainder;
}

const REPEATED_DIGITS = /^(\d)\1{10}$/;

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== CPF_LENGTH) {
    return false;
  }

  if (REPEATED_DIGITS.test(cpf)) {
    return false;
  }

  const digits = Array.from(cpf, Number);

  if (checkDigit(digits.slice(0, 9), 10) !== digits[9]) {
    return false;
  }

  return checkDigit(digits.slice(0, 10), CPF_LENGTH) === digits[10];
}
