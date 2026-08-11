import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

/**
 * O que este teste prova não é o `App`, que é uma casca provisória: é que o
 * harness está de pé — ambiente jsdom, `render` da Testing Library e os
 * matchers de `jest-dom` carregados pelo `setup.ts`.
 *
 * Ele existe também por uma razão prática: `vitest run` sai com código 1
 * quando não encontra teste algum, o que derrubaria o `pnpm test` e o CI. A
 * alternativa seria `--passWithNoTests`, que esconderia o dia em que a
 * descoberta de testes parar de funcionar de verdade.
 *
 * Sai junto com o `App` provisório, em `feat/web-router`.
 */
describe('App', () => {
  it('renderiza o título da aplicação', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Cadastro de clientes' })).toBeInTheDocument();
  });
});
