export const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export type BackendAuthUser = {
  id: string;
  email: string;
  fullName?: string | null;
  role: string;
  partyId?: string | null;
  isActive: boolean;
};

export type AuthResponse = {
  accessToken: string;
  user: BackendAuthUser;
};

export class BackendApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'BackendApiError';
  }
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const { body, headers, ...rest } = options;
  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let payload: T | undefined;

  if (text) {
    try {
      payload = JSON.parse(text) as T;
    } catch {
      payload = text as unknown as T;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null
        ? ((payload as { message?: string }).message ||
          response.statusText ||
          'Request failed')
        : response.statusText || 'Request failed';
    throw new BackendApiError(response.status, message);
  }

  return payload as T;
}

export async function signin(email: string, password: string) {
  return request<AuthResponse>('/auth/signin', {
    method: 'POST',
    body: { email, password },
  });
}

export async function signup(params: {
  email: string;
  password: string;
  fullName?: string;
  role: string;
  partyId?: string;
}) {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: params,
  });
}

export async function getMe(accessToken: string) {
  return request<{ user: BackendAuthUser }>('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
