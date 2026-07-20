import { BACKEND_BASE_URL, BackendApiError } from '@/lib/backend-api';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token: string;
};

type DamlEvent = {
  contractId: string;
  createArguments?: Record<string, unknown>;
  [key: string]: unknown;
};

export type OwnerDraftPayload = {
  contractId: string;
  propertyId: string;
  propertyName: string;
  financialPeriod: string;
  expectedRentalIncome: number;
  expectedExpenses: number;
  reportFrequency: string;
  easycoinFeeRate: number;
  ownerProfitShareOffered: number;
  ownerRetainedShare: number;
  expectedInvestorSettlement: number;
  expectedUpfrontFunding: number;
  currency: string;
};

const request = async <T>(path: string, options: RequestOptions) => {
  const { token, body, headers, ...rest } = options;
  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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
};

const normalizeEvents = (value: unknown): DamlEvent[] => {
  const items = Array.isArray(value)
    ? value
    : Array.isArray((value as { value?: unknown[] } | undefined)?.value)
      ? ((value as { value?: unknown[] }).value as unknown[])
      : [];

  return items
    .map((item) => {
      const raw = item as Record<string, unknown> | null;
      if (!raw) return null;

      const createArguments =
        (raw.createArguments as Record<string, unknown> | undefined) ??
        (raw.createArgument as Record<string, unknown> | undefined) ??
        {};

      if (!raw.contractId && Object.keys(createArguments).length === 0) {
        return null;
      }

      return {
        ...(raw as Record<string, unknown>),
        createArguments,
      } as DamlEvent;
    })
    .filter(Boolean) as DamlEvent[];
};

export function getDamlCreateArguments<T extends Record<string, unknown>>(
  event: DamlEvent,
) {
  return (event.createArguments ?? {}) as T;
}

export async function getOwnerDrafts(token: string) {
  const response = await request<unknown>('/contracts/drafts', {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getValidatedContracts(token: string) {
  const response = await request<unknown>('/contracts/validated', {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function createOwnerDraft(
  token: string,
  payload: OwnerDraftPayload,
) {
  return request<unknown>('/contracts/owner-draft', {
    method: 'POST',
    token,
    body: payload,
  });
}
