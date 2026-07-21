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

export type RejectContractPayload = {
  reason: string;
};

export type ApproveInvestorPayload = {
  investor: string;
  approvalReference: string;
};

export type CreateInstrumentPayload = {
  contractId: string;
  instrumentId: string;
  totalUnits: number;
  nominalValuePerUnit: number;
  investorUpfrontPricePerUnit: number;
  approvedInvestors: string[];
};

export type CreateReportPayload = {
  instrumentId: string;
  periodLabel: string;
  rentalIncome: number;
  expenses: number;
  estimatedNetProfit: number;
  reportUri: string;
  reportHash: string;
  isFinal: boolean;
};

export type FinalReconciliationPayload = {
  instrumentId: string;
  totalRentalIncome: number;
  totalExpenses: number;
  netProfitBeforeFee: number;
  easycoinFee: number;
  ownerSideDistributableProfit: number;
  investorRewardPool: number;
  ownerRetainedProfit: number;
  finalReportHash: string;
};

export type CreateRewardRecordsPayload = {
  holdingCids?: string[];
};

export type CloseSettlementPayload = {
  closureNote: string;
};

export type ConfirmFundingPayload = {
  confirmedPaymentReference: string;
  supplyCid?: string;
};

export type ConfirmRewardPaymentPayload = {
  rewardPaymentReference: string;
};

export type CreateSubscriptionPayload = {
  instrumentId: string;
  requestedUnits: number;
  upfrontAmount: number;
  paymentReference: string;
};

export type AcceptReportPayload = {
  auditor?: string;
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
      : value && typeof value === 'object'
        ? [value]
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

export function getEventValue<T = string>(
  event: DamlEvent,
  path: string,
  fallback?: T,
): T {
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (
      current &&
      typeof current === 'object' &&
      key in (current as Record<string, unknown>)
    ) {
      return (current as Record<string, unknown>)[key];
    }

    return undefined;
  }, event.createArguments ?? event);

  return (value as T | undefined) ?? (fallback as T);
}

export function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toStringValue(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

const withQuery = (path: string, query?: Record<string, string | undefined>) => {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const search = params.toString();
  return search ? `${path}?${search}` : path;
};

export async function getOwnerDrafts(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/contracts/drafts', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getValidatedContracts(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/contracts/validated', { party }), {
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

export async function rejectOwnerDraft(
  token: string,
  contractId: string,
  payload: RejectContractPayload,
) {
  return request<unknown>(`/contracts/${contractId}/reject`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function validateOwnerDraft(token: string, contractId: string) {
  return request<unknown>(`/contracts/${contractId}/validate`, {
    method: 'POST',
    token,
    body: {},
  });
}

export async function getApprovedInvestors(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/investors/approved', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function approveInvestor(
  token: string,
  payload: ApproveInvestorPayload,
) {
  return request<unknown>('/investors/approve', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function getInstruments(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/instruments', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getInstrumentById(token: string, instrumentId: string, party?: string) {
  const response = await request<unknown>(withQuery(`/instruments/${instrumentId}`, { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getInstrumentSupply(token: string, instrumentId: string, party?: string) {
  const response = await request<unknown>(withQuery(`/instruments/${instrumentId}/supply`, { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function createInstrument(
  token: string,
  payload: CreateInstrumentPayload,
) {
  return request<unknown>('/instruments/create', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function createPerformanceReport(
  token: string,
  payload: CreateReportPayload,
) {
  return request<unknown>('/reports', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function getReports(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/reports', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getAcceptedReports(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/reports/accepted', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getReportsByInstrument(
  token: string,
  instrumentId: string,
  party?: string,
) {
  const response = await request<unknown>(withQuery(`/reports/instrument/${instrumentId}`, { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function acceptReport(
  token: string,
  reportCid: string,
  payload: AcceptReportPayload = {},
) {
  return request<unknown>(`/reports/${reportCid}/accept`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function submitFinalReconciliation(
  token: string,
  payload: FinalReconciliationPayload,
) {
  return request<unknown>('/settlements/final', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function getSettlements(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/settlements', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getRewardRecords(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/settlements/rewards', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getClosedContracts(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/settlements/closed', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function createRewardRecords(
  token: string,
  reconciliationCid: string,
  payload: CreateRewardRecordsPayload,
) {
  return request<unknown>(`/settlements/${reconciliationCid}/rewards`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function closeSettlement(
  token: string,
  reconciliationCid: string,
  payload: CloseSettlementPayload,
) {
  return request<unknown>(`/settlements/${reconciliationCid}/close`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function getSubscriptionFundingConfirmations(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/subscriptions/funding-confirmations', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getSubscriptions(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/subscriptions', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function createSubscription(
  token: string,
  payload: CreateSubscriptionPayload,
) {
  return request<unknown>('/subscriptions', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function confirmFunding(
  token: string,
  subscriptionCid: string,
  payload: ConfirmFundingPayload,
) {
  return request<unknown>(`/subscriptions/${subscriptionCid}/confirm-funding`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function getRewardPaymentConfirmations(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/payments/reward-confirmations', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getPaymentRewards(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/payments/rewards', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function confirmRewardPayment(
  token: string,
  rewardCid: string,
  payload: ConfirmRewardPaymentPayload,
) {
  return request<unknown>(`/payments/rewards/${rewardCid}/confirm`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function getHoldings(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/holdings', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getHoldingsByHolder(token: string, holder: string, reader?: string) {
  const response = await request<unknown>(withQuery(`/holdings/party/${holder}`, { reader }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getHoldingsByInstrument(
  token: string,
  instrumentId: string,
  party?: string,
) {
  const response = await request<unknown>(withQuery(`/holdings/instrument/${instrumentId}`, { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getHoldingByCid(token: string, holdingCid: string, party?: string) {
  const response = await request<unknown>(withQuery(`/holdings/cid/${holdingCid}`, { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getRedemptionRecords(token: string, party?: string) {
  const response = await request<unknown>(withQuery('/redemptions', { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}

export async function getRedemptionRecordsByInstrument(
  token: string,
  instrumentId: string,
  party?: string,
) {
  const response = await request<unknown>(withQuery(`/redemptions/instrument/${instrumentId}`, { party }), {
    method: 'GET',
    token,
  });
  return normalizeEvents(response);
}
