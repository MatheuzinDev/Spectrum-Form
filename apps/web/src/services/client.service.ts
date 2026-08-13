import { clientResponseSchema, type ClientResponse, type CreateClientData } from '@repo/shared';

import { ApiError, http } from './http';

const sampleDataEnabled = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false';

const SAMPLE_TAKEN_CPF = '52998224725';

export async function createClient(input: CreateClientData): Promise<ClientResponse> {
  if (sampleDataEnabled) {
    if (input.cpf === SAMPLE_TAKEN_CPF) {
      throw new ApiError(409, 'CPF_ALREADY_REGISTERED', 'CPF já cadastrado', {
        cpf: 'Este CPF já está cadastrado',
      });
    }

    const { clientResponseFixture } = await import('@/tests/fixtures');
    return clientResponseFixture(input);
  }

  return clientResponseSchema.parse(await http.post('/api/clients', input));
}
