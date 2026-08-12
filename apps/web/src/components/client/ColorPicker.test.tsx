import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listColors } from '@/services/color.service';
import { colorsFixture } from '@/tests/fixtures';
import { renderWithQuery } from '@/tests/render';

import { ColorPicker } from './ColorPicker';

vi.mock('@/services/color.service');

const listColorsMock = vi.mocked(listColors);

beforeEach(() => {
  listColorsMock.mockResolvedValue(colorsFixture);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('ColorPicker', () => {
  it('renderiza as cores devolvidas pelo serviço, e não uma lista do componente', async () => {
    listColorsMock.mockResolvedValue([
      { id: 42, slug: 'turquesa', label: 'Turquesa', hex: '#1abc9c' },
    ]);

    renderWithQuery(<ColorPicker value={null} onChange={vi.fn()} />);

    expect(await screen.findByRole('radio', { name: 'Turquesa' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Verde' })).toBeNull();
  });

  it('aplica o hex por style inline', async () => {
    renderWithQuery(<ColorPicker value={null} onChange={vi.fn()} />);

    const option = (await screen.findByRole('radio', { name: 'Verde' })).closest('label');
    const swatch = within(option as HTMLElement).getByTestId('color-swatch');

    expect(swatch).toHaveStyle({ backgroundColor: '#2ecc71' });
  });

  it('identifica cada opção por texto, não só pela cor', async () => {
    renderWithQuery(<ColorPicker value={null} onChange={vi.fn()} />);

    await screen.findByRole('radio', { name: 'Vermelho' });

    for (const color of colorsFixture) {
      expect(screen.getByRole('radio', { name: color.label })).toBeInTheDocument();
    }
  });

  it('avisa qual cor foi escolhida', async () => {
    const onChange = vi.fn();
    renderWithQuery(<ColorPicker value={null} onChange={onChange} />);

    await userEvent.click(await screen.findByRole('radio', { name: 'Verde' }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marca como selecionada a cor recebida por prop', async () => {
    renderWithQuery(<ColorPicker value={4} onChange={vi.fn()} />);

    expect(await screen.findByRole('radio', { name: 'Verde' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Azul' })).not.toBeChecked();
  });

  it('assume a própria falha e permite tentar de novo', async () => {
    listColorsMock.mockRejectedValue(new Error('sem rede'));

    renderWithQuery(<ColorPicker value={null} onChange={vi.fn()} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível carregar as cores.');

    listColorsMock.mockResolvedValue(colorsFixture);
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByRole('radio', { name: 'Verde' })).toBeInTheDocument();
  });
});
