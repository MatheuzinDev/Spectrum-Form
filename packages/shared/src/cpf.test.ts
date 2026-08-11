import { describe, expect, it } from 'vitest';

import { isValidCpf, onlyDigits } from './cpf';

describe('onlyDigits', () => {
  it('remove a máscara', () => {
    expect(onlyDigits('529.982.247-25')).toBe('52998224725');
  });

  it('devolve string vazia quando não há dígito', () => {
    expect(onlyDigits('abc.def-gh')).toBe('');
  });
});

describe('isValidCpf', () => {
  it.each([
    ['52998224725', 'dígitos verificadores 2 e 5'],
    ['11144477735', 'outro CPF válido conhecido'],
    ['12345678909', 'primeiro dígito verificador igual a 0'],
    ['00000001830', 'segundo dígito verificador igual a 0'],
  ])('aceita %s — %s', (cpf) => {
    expect(isValidCpf(cpf)).toBe(true);
  });

  it('aceita CPF com máscara', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('recusa quando o primeiro dígito verificador está errado', () => {
    expect(isValidCpf('52998224735')).toBe(false);
  });

  it('recusa quando o segundo dígito verificador está errado', () => {
    expect(isValidCpf('52998224726')).toBe(false);
  });

  // O caso que o cálculo ingênuo deixa passar: para uma sequência de um dígito
  // só, a conta dos verificadores fecha. Sem a rejeição explícita do cpf.ts,
  // todos os dez seriam aceitos.
  it.each([
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
  ])('recusa a sequência repetida %s', (cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });

  it('recusa com menos de 11 dígitos', () => {
    expect(isValidCpf('5299822472')).toBe(false);
  });

  it('recusa com mais de 11 dígitos', () => {
    expect(isValidCpf('529982247251')).toBe(false);
  });

  it('recusa string vazia', () => {
    expect(isValidCpf('')).toBe(false);
  });

  it('recusa texto sem dígito nenhum', () => {
    expect(isValidCpf('abcdefghijk')).toBe(false);
  });
});
