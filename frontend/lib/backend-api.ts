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

export type BackendUser = {
  id: string;
  email: string;
  fullName?: string | null;
  role: string;
  partyId?: string | null;
  approvalStatus: string;
  isActive: boolean;
  createdAt?: string;
};

export type CreatePropertyProfileParams = {
  propertyId: string;
  name: string;
  description?: string;
  propertyType?: string;
  address?: string;
  city?: string;
  country?: string;
  surfaceArea?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  expectedRentalIncome?: number;
  expectedExpenses?: number;
  currency?: string;
};

export type BackendProperty = {
  id?: string;
  propertyId: string;
  name: string;
  description?: string | null;
  propertyType?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  surfaceArea?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  expectedRentalIncome?: number | null;
  expectedExpenses?: number | null;
  currency?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  images?: Array<{
    id?: string;
    url: string;
    caption?: string | null;
    isMain?: boolean;
    sortOrder?: number;
  }>;
  rentalHistory?: Array<{
    id?: string;
    periodLabel: string;
    rentalIncome: number;
    expenses?: number | null;
    occupancyRate?: number | null;
    netIncome?: number | null;
    currency?: string | null;
  }>;
  documents?: Array<{
    id?: string;
    name: string;
    url: string;
    documentHash?: string | null;
  }>;
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

export async function createPropertyProfile(
  accessToken: string,
  params: CreatePropertyProfileParams,
) {
  return request<BackendProperty>('/properties', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: params,
  });
}

export async function getMyProperties(accessToken: string) {
  return request<BackendProperty[]>('/properties/my', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getPropertyDetails(accessToken: string, propertyId: string) {
  return request<BackendProperty>(`/properties/${encodeURIComponent(propertyId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getProperties(accessToken: string) {
  return request<BackendProperty[]>('/properties', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updatePropertyProfile(
  accessToken: string,
  propertyId: string,
  params: Partial<CreatePropertyProfileParams>,
) {
  return request<BackendProperty>(`/properties/${encodeURIComponent(propertyId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: params,
  });
}

export async function addPropertyImage(
  accessToken: string,
  propertyId: string,
  params: { url: string; caption?: string; isMain?: boolean; sortOrder?: number },
) {
  return request<NonNullable<BackendProperty['images']>[number]>(`/properties/${encodeURIComponent(propertyId)}/images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: params,
  });
}

export async function addPropertyRentalHistory(
  accessToken: string,
  propertyId: string,
  params: {
    periodLabel: string;
    rentalIncome: number;
    expenses?: number;
    occupancyRate?: number;
    netIncome?: number;
    currency?: string;
  },
) {
  return request<NonNullable<BackendProperty['rentalHistory']>[number]>(
    `/properties/${encodeURIComponent(propertyId)}/rental-history`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: params,
    },
  );
}

export async function addPropertyDocument(
  accessToken: string,
  propertyId: string,
  params: { name: string; url: string; documentHash?: string },
) {
  return request<NonNullable<BackendProperty['documents']>[number]>(
    `/properties/${encodeURIComponent(propertyId)}/documents`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: params,
    },
  );
}

export async function submitPropertyForReview(accessToken: string, propertyId: string) {
  return request<BackendProperty>(
    `/properties/${encodeURIComponent(propertyId)}/submit-review`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function approveProperty(accessToken: string, propertyId: string) {
  return request<BackendProperty>(`/properties/${encodeURIComponent(propertyId)}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getUsers(accessToken: string) {
  return request<BackendUser[]>('/users', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getEligibleInvestors(accessToken: string) {
  return request<BackendUser[]>('/investors/eligible', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getPendingUsers(accessToken: string) {
  return request<BackendUser[]>('/users/pending', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function approveUser(accessToken: string, userId: string, partyId: string) {
  return request<BackendUser>(`/users/${userId}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: { partyId },
  });
}

export async function rejectUser(accessToken: string, userId: string, reason: string) {
  return request<BackendUser>(`/users/${userId}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: { reason },
  });
}

export async function deactivateUser(accessToken: string, userId: string) {
  return request<BackendUser>(`/users/${userId}/deactivate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function reactivateUser(accessToken: string, userId: string) {
  return request<BackendUser>(`/users/${userId}/reactivate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
