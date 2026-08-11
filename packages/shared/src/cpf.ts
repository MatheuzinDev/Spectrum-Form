/**
 * Validação de CPF pelos dois dígitos verificadores.
 *
 * O CPF é persistido com apenas dígitos (`CHAR(11)`, seção 6): guardar
 * `123.456.789-09` e `12345678909` como registros distintos anularia a
 * constraint UNIQUE que sustenta o requisito de cadastro único.
 */

const CPF_LENGTH = 11;

/** Remove tudo que não é dígito. A máscara é responsabilidade da interface. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Calcula um dígito verificador. Os pesos são decrescentes a partir de
 * `weightStart`: 10..2 para o primeiro dígito, 11..2 para o segundo.
 */
function checkDigit(digits: readonly number[], weightStart: number): number {
  const sum = digits.reduce((total, digit, index) => total + digit * (weightStart - index), 0);
  const remainder = sum % CPF_LENGTH;

  return remainder < 2 ? 0 : CPF_LENGTH - remainder;
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== CPF_LENGTH) {
    return false;
  }

  // Sequências de um dígito só passam no cálculo dos verificadores: para
  // `111.111.111-11` a conta fecha e o CPF seria aceito. A rejeição precisa
  // ser explícita, e é o caso que o cálculo ingênuo deixa passar.
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = Array.from(cpf, Number);

  if (checkDigit(digits.slice(0, 9), 10) !== digits[9]) {
    return false;
  }

  return checkDigit(digits.slice(0, 10), CPF_LENGTH) === digits[10];
}
