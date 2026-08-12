import { z } from 'zod';

const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

export const UNEXPECTED_ERROR = 'UNEXPECTED_ERROR';
export const NETWORK_ERROR = 'NETWORK_ERROR';

const UNEXPECTED_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';
const NETWORK_MESSAGE = 'Não foi possível falar com o servidor.';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  const envelope = errorEnvelopeSchema.safeParse(body);

  if (!envelope.success) {
    return new ApiError(response.status, UNEXPECTED_ERROR, UNEXPECTED_MESSAGE);
  }

  const { code, message, fields } = envelope.data.error;
  return new ApiError(response.status, code, message, fields ?? {});
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(init?.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR, NETWORK_MESSAGE);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function withJsonBody(method: string, body: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}

export const http = {
  get: (path: string): Promise<unknown> => request(path),
  post: (path: string, body?: unknown): Promise<unknown> =>
    request(path, withJsonBody('POST', body)),
  patch: (path: string, body?: unknown): Promise<unknown> =>
    request(path, withJsonBody('PATCH', body)),
};
