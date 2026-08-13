import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClientFormPage } from '@/pages/ClientFormPage';
import { createClient } from '@/services/client.service';
import { listColors } from '@/services/color.service';
import { ApiError } from '@/services/http';
import { clientResponseFixture, colorsFixture } from '@/tests/fixtures';
import { renderWithQuery } from '@/tests/render';

vi.mock('@/services/color.service');
vi.mock('@/services/client.service');

const listColorsMock = vi.mocked(listColors);
const createClientMock = vi.mocked(createClient);

const VALID_CPF = '123.456.789-09';

beforeEach(() => {
  listColorsMock.mockResolvedValue(colorsFixture);
});

afterEach(() => {
  vi.resetAllMocks();
});

async function fillForm(options: { cpf?: string } = {}) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Nome completo'), 'Maria Silva');
  await user.type(screen.getByLabelText('CPF'), options.cpf ?? VALID_CPF);
  await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
  await user.click(await screen.findByRole('radio', { name: 'Verde' }));

  return user;
}

function submitButton() {
  return screen.getByRole('button', { name: 'Enviar cadastro' });
}

describe('ClientForm', () => {
  it('envia o CPF em dígitos, não a máscara digitada', async () => {
    createClientMock.mockImplementation((input) => Promise.resolve(clientResponseFixture(input)));

    renderWithQuery(<ClientFormPage />);
    const user = await fillForm();

    expect(screen.getByLabelText('CPF')).toHaveValue(VALID_CPF);

    await user.click(submitButton());

    await waitFor(() => {
      expect(createClientMock).toHaveBeenCalledWith(
        expect.objectContaining({ cpf: '12345678909', colorId: 4 }),
      );
    });
  });

  it('recusa sequência de dígitos repetidos antes de enviar', async () => {
    renderWithQuery(<ClientFormPage />);
    const user = await fillForm({ cpf: '111.111.111-11' });

    await user.click(submitButton());

    expect(await screen.findByText('CPF inválido')).toBeInTheDocument();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('mostra o 409 de CPF duplicado no campo do CPF', async () => {
    createClientMock.mockRejectedValue(
      new ApiError(409, 'CPF_ALREADY_REGISTERED', 'CPF já cadastrado', {
        cpf: 'Este CPF já está cadastrado',
      }),
    );

    renderWithQuery(<ClientFormPage />);
    const user = await fillForm();
    await user.click(submitButton());

    const message = await screen.findByText('Este CPF já está cadastrado');
    expect(screen.getByLabelText('CPF')).toHaveAttribute('aria-invalid', 'true');
    expect(message).toBeInTheDocument();
  });

  it('mostra o 409 de e-mail duplicado no campo do e-mail', async () => {
    createClientMock.mockRejectedValue(
      new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'E-mail já cadastrado', {
        email: 'Este e-mail já está cadastrado',
      }),
    );

    renderWithQuery(<ClientFormPage />);
    const user = await fillForm();
    await user.click(submitButton());

    expect(await screen.findByText('Este e-mail já está cadastrado')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it('mostra erro sem campo como alerta do formulário', async () => {
    createClientMock.mockRejectedValue(
      new ApiError(404, 'COLOR_NOT_FOUND', 'A cor escolhida não está mais disponível.'),
    );

    renderWithQuery(<ClientFormPage />);
    const user = await fillForm();
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A cor escolhida não está mais disponível.',
    );
  });

  it('mostra o recibo com o CPF mascarado e permite recomeçar', async () => {
    createClientMock.mockImplementation((input) => Promise.resolve(clientResponseFixture(input)));

    renderWithQuery(<ClientFormPage />);
    const user = await fillForm();
    await user.click(submitButton());

    const receipt = await screen.findByRole('status');
    expect(receipt).toHaveTextContent('Pronto, Maria.');
    expect(receipt).toHaveTextContent('123.456.789-09');
    expect(receipt).toHaveTextContent('Verde');

    await user.click(screen.getByRole('button', { name: 'Cadastrar outra pessoa' }));

    expect(screen.getByLabelText('CPF')).toHaveValue('');
  });

  it('conta os caracteres das observações', async () => {
    renderWithQuery(<ClientFormPage />);
    const user = userEvent.setup();

    expect(screen.getByText('0/500')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Observações'), 'Cliente');

    expect(screen.getByText('7/500')).toBeInTheDocument();
  });
});
