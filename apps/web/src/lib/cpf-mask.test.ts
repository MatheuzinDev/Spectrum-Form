import { onlyDigits } from '@repo/shared';
import { describe, expect, it } from 'vitest';

import { maskCpf } from './cpf-mask';

describe('maskCpf', () => {
  it.each([
    ['', ''],
    ['5', '5'],
    ['529', '529'],
    ['5299', '529.9'],
    ['529982', '529.982'],
    ['5299822', '529.982.2'],
    ['529982247', '529.982.247'],
    ['5299822472', '529.982.247-2'],
    ['52998224725', '529.982.247-25'],
  ])('mascara %s durante a digitação', (typed, expected) => {
    expect(maskCpf(typed)).toBe(expected);
  });

  it('descarta o que passa de onze dígitos', () => {
    expect(maskCpf('5299822472599999')).toBe('529.982.247-25');
  });

  it('ignora o que não é dígito', () => {
    expect(maskCpf('52a9b9.82-247/25')).toBe('529.982.247-25');
  });

  it('mantém a máscara estável ao remascarar', () => {
    expect(maskCpf(maskCpf('52998224725'))).toBe('529.982.247-25');
  });

  it('preserva os dígitos que o usuário digitou', () => {
    expect(onlyDigits(maskCpf('52998224725'))).toBe('52998224725');
  });
});
