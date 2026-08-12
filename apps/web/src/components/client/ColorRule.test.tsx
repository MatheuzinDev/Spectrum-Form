import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listColors } from '@/services/color.service';
import { colorsFixture } from '@/tests/fixtures';
import { renderWithQuery } from '@/tests/render';

import { ColorRule } from './ColorRule';

vi.mock('@/services/color.service');

beforeEach(() => {
  vi.mocked(listColors).mockResolvedValue(colorsFixture);
});

afterEach(() => {
  vi.resetAllMocks();
});

function bands(container: HTMLElement) {
  return container.querySelectorAll('[aria-hidden="true"] > span');
}

describe('ColorRule', () => {
  it('mostra uma faixa por cor enquanto nada foi escolhido', async () => {
    const { container } = renderWithQuery(<ColorRule selectedColorId={null} />);

    await vi.waitFor(() => {
      expect(bands(container)).toHaveLength(colorsFixture.length);
    });
  });

  it('colapsa na cor escolhida', async () => {
    const { container } = renderWithQuery(<ColorRule selectedColorId={4} />);

    await vi.waitFor(() => {
      expect(bands(container)).toHaveLength(1);
    });

    expect(bands(container)[0]).toHaveStyle({ backgroundColor: '#2ecc71' });
  });

  it('não renderiza nada enquanto as cores não chegam', () => {
    const { container } = renderWithQuery(<ColorRule selectedColorId={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('não quebra quando a consulta falha', async () => {
    vi.mocked(listColors).mockRejectedValue(new Error('sem rede'));

    const { container } = renderWithQuery(<ColorRule selectedColorId={null} />);

    await vi.waitFor(() => {
      expect(screen.queryByRole('status')).toBeNull();
    });
    expect(container).toBeEmptyDOMElement();
  });
});
