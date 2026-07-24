'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { useSession } from '@/lib/session';
import {
  BackendApiError,
  approveProperty,
  createPropertyProfile,
  getMyProperties,
  getProperties,
  getPropertyDetails,
  type BackendProperty,
} from '@/lib/backend-api';
import {
  createOwnerDraft,
  getDamlCreateArguments,
  getOwnerDrafts,
  getValidatedContracts,
  rejectOwnerDraft,
  validateOwnerDraft,
  type OwnerDraftPayload,
} from '@/lib/platform-api';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

type DraftRecord = {
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
  status: 'Draft' | 'Validated';
  createdAt: string;
};

type EasycoinDraftReviewProps = {
  token: string;
};

function PropertiesDirectory({ token }: { token: string }) {
  const router = useRouter();
  const [properties, setProperties] = React.useState<BackendProperty[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [approvingId, setApprovingId] = React.useState<string | null>(null);

  const loadProperties = React.useCallback(async () => {
    try {
      setLoading(true);
      setProperties(await getProperties(token));
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : 'Unable to load properties');
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadProperties();
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async (propertyId: string) => {
    setApprovingId(propertyId);
    try {
      const updated = await approveProperty(token, propertyId);
      setProperties((current) => current.map((property) => property.propertyId === updated.propertyId ? updated : property));
      toast.success('Property approved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to approve property');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <Card className="mt-6 border-border/70">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Property directory</CardTitle>
          <CardDescription>All property profiles available to your role.</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading properties...
          </div>
        ) : properties.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
            No property profile found.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div key={property.propertyId} role="link" tabIndex={0} onClick={() => router.push(`/dashboard/properties/${property.propertyId}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') router.push(`/dashboard/properties/${property.propertyId}`); }} className="cursor-pointer rounded-xl border border-border/70 bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{property.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{property.propertyId}</p>
                  </div>
                  <StatusBadge status={property.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {[property.city, property.country].filter(Boolean).join(', ') || 'Location not provided'}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Income</p>
                    <p className="mt-1 font-medium">
                      {property.expectedRentalIncome != null ? formatCurrency(property.expectedRentalIncome) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Expenses</p>
                    <p className="mt-1 font-medium">
                      {property.expectedExpenses != null ? formatCurrency(property.expectedExpenses) : '—'}
                    </p>
                  </div>
                </div>
                {property.status === 'PENDING_REVIEW' && <Button type="button" className="mt-4 w-full gap-2" onClick={(event) => { event.stopPropagation(); void handleApprove(property.propertyId); }} disabled={approvingId === property.propertyId}>{approvingId === property.propertyId && <Loader2 className="h-4 w-4 animate-spin" />}{approvingId === property.propertyId ? 'Approving...' : 'Approve property'}</Button>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type DraftFormState = {
  contractId: string;
  propertyId: string;
  propertyName: string;
  financialPeriod: string;
  expectedRentalIncome: string;
  expectedExpenses: string;
  reportFrequency: string;
  easycoinFeeRate: string;
  ownerProfitShareOffered: string;
  ownerRetainedShare: string;
  expectedInvestorSettlement: string;
  expectedUpfrontFunding: string;
  currency: string;
};

type PropertyProfileFormState = {
  description: string;
  propertyType: string;
  address: string;
  city: string;
  country: string;
  surfaceArea: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
};

const initialPropertyProfileForm: PropertyProfileFormState = {
  description: '',
  propertyType: 'Apartment',
  address: '',
  city: 'Casablanca',
  country: 'Morocco',
  surfaceArea: '',
  rooms: '',
  bedrooms: '',
  bathrooms: '',
};

const initialFormState: DraftFormState = {
  contractId: '',
  propertyId: '',
  propertyName: 'Managed Apartment Casablanca',
  financialPeriod: '2026',
  expectedRentalIncome: '120000',
  expectedExpenses: '24000',
  reportFrequency: 'MONTHLY',
  easycoinFeeRate: '0.2',
  ownerProfitShareOffered: '0.5',
  ownerRetainedShare: '0.5',
  expectedInvestorSettlement: '38400',
  expectedUpfrontFunding: '34000',
  currency: 'MAD',
};

function nextSequenceId(prefix: string, values: string[]) {
  const max = values.reduce((currentMax, value) => {
    const match = value.match(new RegExp(`^${prefix}-(\\d+)$`, 'i'));
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);

  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

const workflowSteps = [
  {
    title: 'Draft contract',
    description: 'Create the managed property contract with business IDs and financial terms.',
    icon: ClipboardList,
  },
  {
    title: 'Easycoin review',
    description: 'Easycoin validates the draft or requests changes before token creation.',
    icon: ShieldCheck,
  },
  {
    title: 'Investor flow',
    description: 'After validation, investors fund the participation instrument.',
    icon: CheckCircle2,
  },
];

function toNumber(value: string) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function normalizeDraftRecord(event: unknown, status: DraftRecord['status']): DraftRecord | null {
  const raw = event as Record<string, unknown> | null;
  if (!raw) return null;

  const createArguments = getDamlCreateArguments<{
    contractData?: Record<string, unknown>;
    terms?: Record<string, unknown>;
  }>({ contractId: String(raw.contractId ?? ''), createArguments: raw.createArguments as Record<string, unknown> | undefined });

  const contractData = createArguments.contractData ?? {};
  const terms = createArguments.terms ?? {};

  const contractId = String(contractData.contractId ?? raw.contractId ?? '');
  if (!contractId) return null;

  return {
    contractId,
    propertyId: String(contractData.propertyId ?? ''),
    propertyName: String(contractData.propertyName ?? 'Managed property'),
    financialPeriod: String(contractData.financialPeriod ?? '2026'),
    expectedRentalIncome: toNumber(String(contractData.expectedRentalIncome ?? 0)),
    expectedExpenses: toNumber(String(contractData.expectedExpenses ?? 0)),
    reportFrequency: String(contractData.reportFrequency ?? 'MONTHLY'),
    easycoinFeeRate: toNumber(String(terms.easycoinFeeRate ?? 0)),
    ownerProfitShareOffered: toNumber(String(terms.ownerProfitShareOffered ?? 0)),
    ownerRetainedShare: toNumber(String(terms.ownerRetainedShare ?? 0)),
    expectedInvestorSettlement: toNumber(String(terms.expectedInvestorSettlement ?? 0)),
    expectedUpfrontFunding: toNumber(String(terms.expectedUpfrontFunding ?? 0)),
    currency: String(terms.currency ?? 'MAD'),
    status,
    createdAt: String(raw.createdAt ?? ''),
  };
}

function DraftTable({
  title,
  description,
  rows,
  emptyLabel,
  badgeLabel,
}: {
  title: string;
  description: string;
  rows: DraftRecord[];
  emptyLabel: string;
  badgeLabel: string;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-2 border-b border-border/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {badgeLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">{emptyLabel}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Income</TableHead>
                <TableHead>Funding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.status}-${row.contractId}`}>
                  <TableCell className="font-medium">
                    <span>{row.contractId}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{row.propertyName}</span>
                      <span className="text-xs text-muted-foreground">{row.propertyId}</span>
                    </div>
                  </TableCell>
                  <TableCell>{row.financialPeriod}</TableCell>
                  <TableCell>{formatCurrency(row.expectedRentalIncome)}</TableCell>
                  <TableCell>{formatCurrency(row.expectedUpfrontFunding)}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function EasycoinDraftReview({ token }: EasycoinDraftReviewProps) {
  const [drafts, setDrafts] = React.useState<DraftRecord[]>([]);
  const [validatedContracts, setValidatedContracts] = React.useState<DraftRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = React.useState<Record<string, string>>({});
  const [selectedDraft, setSelectedDraft] = React.useState<DraftRecord | null>(null);
  const [draftPage, setDraftPage] = React.useState(1);
  const draftsPerPage = 3;
  const draftPageCount = Math.max(1, Math.ceil(drafts.length / draftsPerPage));
  const visibleDrafts = drafts.slice((draftPage - 1) * draftsPerPage, draftPage * draftsPerPage);

  React.useEffect(() => {
    setDraftPage((current) => Math.min(current, draftPageCount));
  }, [draftPageCount]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [draftResponse, validatedResponse] = await Promise.all([
        getOwnerDrafts(token),
        getValidatedContracts(token),
      ]);

      const nextDrafts = draftResponse
        .map((event) => normalizeDraftRecord(event, 'Draft'))
        .filter(Boolean) as DraftRecord[];
      const nextValidatedContracts = validatedResponse
        .map((event) => normalizeDraftRecord(event, 'Validated'))
        .filter(Boolean) as DraftRecord[];

      setDrafts(nextDrafts);
      setValidatedContracts(nextValidatedContracts);

    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleValidate = async (contractId: string) => {
    setPendingAction(contractId);
    try {
      await validateOwnerDraft(token, contractId);
      toast.success(`Draft ${contractId} validated`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to validate draft');
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async (contractId: string) => {
    const reason = rejectReasons[contractId]?.trim();
    if (!reason) {
      toast.error('Please enter a reject reason');
      return;
    }

    setPendingAction(contractId);
    try {
      await rejectOwnerDraft(token, contractId, { reason });
      toast.success(`Draft ${contractId} rejected`);
      setRejectReasons((current) => ({ ...current, [contractId]: '' }));
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reject draft');
    } finally {
      setPendingAction(null);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Review submitted drafts"
        description="Check each property submission, then approve it or send it back for correction."
      >
        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Drafts pending review</CardDescription>
            <CardTitle className="text-2xl">{drafts.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Owner-submitted contracts waiting for Easycoin validation.
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Validated contracts</CardDescription>
            <CardTitle className="text-2xl">{validatedContracts.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Ready for token instrument creation.
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Current reviewer</CardDescription>
            <CardTitle className="text-2xl">Easycoin</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{token ? 'JWT authenticated' : 'No token'}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Next step</CardDescription>
            <CardTitle className="text-2xl">Validate or reject</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Approved drafts become validated contracts on the ledger.
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="min-w-0 overflow-hidden border-primary/15 shadow-sm">
          <CardHeader className="space-y-2 border-b border-border/60 bg-gradient-to-br from-primary/[0.04] to-background">
            <div className="space-y-1">
              <CardTitle className="text-lg">Draft queue</CardTitle>
              <CardDescription>Review each submission and choose an action.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 !pt-8 sm:!pt-9">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading drafts...
              </div>
            ) : drafts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                No draft awaiting review.
              </div>
            ) : (
              visibleDrafts.map((draft) => (
                <div
                  key={draft.contractId}
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest('button, input')) return;
                    setSelectedDraft(draft);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedDraft(draft);
                    }
                  }}
                  className="min-w-0 cursor-pointer rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.025] via-background to-muted/30 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <div className="relative">
                    <div className="w-full min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {draft.contractId}
                        </Badge>
                        <StatusBadge status={draft.status} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight">{draft.propertyName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {draft.propertyId} • {draft.financialPeriod} • {draft.reportFrequency}
                        </p>
                      </div>
                      <div className="grid min-w-0 gap-2 sm:grid-cols-3">
                        <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-background/70 p-3 text-sm">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Income</p>
                          <p className="mt-1 break-words text-sm font-semibold leading-5 tabular-nums sm:text-base">{formatCurrency(draft.expectedRentalIncome)}</p>
                        </div>
                        <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-background/70 p-3 text-sm">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Expenses</p>
                          <p className="mt-1 break-words text-sm font-semibold leading-5 tabular-nums sm:text-base">{formatCurrency(draft.expectedExpenses)}</p>
                        </div>
                        <div className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-background/70 p-3 text-sm">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Upfront funding</p>
                          <p className="mt-1 break-words text-sm font-semibold leading-5 tabular-nums sm:text-base">{formatCurrency(draft.expectedUpfrontFunding)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex w-full shrink-0 flex-col gap-2 sm:w-48 lg:absolute lg:right-0 lg:top-0 lg:mt-0">
                      <Button
                        className="h-11 gap-2 rounded-xl shadow-sm"
                        onClick={() => handleValidate(draft.contractId)}
                        disabled={pendingAction === draft.contractId}
                      >
                        {pendingAction === draft.contractId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Validate draft
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`reject-${draft.contractId}`}>Request a correction</Label>
                      <span className="text-xs text-muted-foreground">Optional reason</span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id={`reject-${draft.contractId}`}
                        placeholder="Explain what needs to be corrected..."
                        value={rejectReasons[draft.contractId] ?? ''}
                        onChange={(e) =>
                          setRejectReasons((current) => ({
                            ...current,
                            [draft.contractId]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        variant="outline"
                        className="gap-2 rounded-xl"
                        onClick={() => handleReject(draft.contractId)}
                        disabled={pendingAction === draft.contractId}
                      >
                        {pendingAction === draft.contractId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
            {drafts.length > draftsPerPage && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground">
                  Page {draftPage} of {draftPageCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1 rounded-xl"
                    onClick={() => setDraftPage((current) => Math.max(1, current - 1))}
                    disabled={draftPage === 1}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1 rounded-xl"
                    onClick={() => setDraftPage((current) => Math.min(draftPageCount, current + 1))}
                    disabled={draftPage === draftPageCount}
                  >
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base font-semibold">Validated contracts</CardTitle>
            <CardDescription>Ready for investor approval and instrument creation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {validatedContracts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                No validated contract yet.
              </div>
            ) : (
              validatedContracts.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.propertyName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.contractId} • {item.propertyId}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Investor settlement</p>
                      <p className="mt-1 text-sm font-medium">{formatCurrency(item.expectedInvestorSettlement)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Currency</p>
                      <p className="mt-1 text-sm font-medium">{item.currency}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(selectedDraft)}
        onOpenChange={(open) => {
          if (!open) setSelectedDraft(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedDraft && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDraft.propertyName}</DialogTitle>
                <DialogDescription>Review the complete submission before taking action.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Contract</p>
                  <p className="mt-1 font-semibold">{selectedDraft.contractId}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Property ID: {selectedDraft.propertyId}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Period</p>
                  <p className="mt-1 font-medium">{selectedDraft.financialPeriod}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Report frequency</p>
                  <p className="mt-1 font-medium">{selectedDraft.reportFrequency}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected income</p>
                  <p className="mt-1 font-medium">{formatCurrency(selectedDraft.expectedRentalIncome)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected expenses</p>
                  <p className="mt-1 font-medium">{formatCurrency(selectedDraft.expectedExpenses)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Upfront funding</p>
                  <p className="mt-1 font-medium">{formatCurrency(selectedDraft.expectedUpfrontFunding)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Investor settlement</p>
                  <p className="mt-1 font-medium">{formatCurrency(selectedDraft.expectedInvestorSettlement)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Currency</p>
                  <p className="mt-1 font-medium">{selectedDraft.currency}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Easycoin fee</p>
                  <p className="mt-1 font-medium">{selectedDraft.easycoinFeeRate}%</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Owner shares</p>
                  <p className="mt-1 font-medium">Offered {selectedDraft.ownerProfitShareOffered}% · Retained {selectedDraft.ownerRetainedShare}%</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleReject(selectedDraft.contractId)}
                  disabled={pendingAction === selectedDraft.contractId}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reject draft
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => handleValidate(selectedDraft.contractId)}
                  disabled={pendingAction === selectedDraft.contractId}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Validate draft
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AuditorContractReview({
  token,
  roleLabel = 'Auditor',
}: {
  token: string;
  roleLabel?: 'Auditor' | 'Legal admin';
}) {
  const [drafts, setDrafts] = React.useState<DraftRecord[]>([]);
  const [validatedContracts, setValidatedContracts] = React.useState<DraftRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [draftResponse, validatedResponse] = await Promise.all([
        getOwnerDrafts(token),
        getValidatedContracts(token),
      ]);

      setDrafts(
        draftResponse
          .map((event) => normalizeDraftRecord(event, 'Draft'))
          .filter(Boolean) as DraftRecord[]
      );
      setValidatedContracts(
        validatedResponse
          .map((event) => normalizeDraftRecord(event, 'Validated'))
          .filter(Boolean) as DraftRecord[]
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`${roleLabel} contract review`}
        description={`Read owner drafts and validated managed contracts visible to the ${roleLabel.toLowerCase()} party.`}
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Draft contracts</CardDescription>
            <CardTitle className="text-2xl">{drafts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Validated contracts</CardDescription>
            <CardTitle className="text-2xl">{validatedContracts.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-6 grid gap-4">
        <DraftTable
          title="Drafts visible to auditor"
          description={`Owner-submitted contracts visible to ${roleLabel.toLowerCase()} for read-only review.`}
          rows={drafts}
          emptyLabel={`No draft is visible to this ${roleLabel.toLowerCase()}.`}
          badgeLabel="Read-only"
        />
        <DraftTable
          title="Validated contracts"
          description="Validated contracts available for compliance and audit visibility."
          rows={validatedContracts}
          emptyLabel={`No validated contract is visible to this ${roleLabel.toLowerCase()}.`}
          badgeLabel="Read-only"
        />
      </div>
    </>
  );
}

function AdminContractsNotice() {
  return (
    <>
      <PageHeader
        title="Admin contract access"
        description="The current backend guards do not expose contract draft or validated-contract endpoints to ADMIN."
      />
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-xl">Contracts are role-scoped</CardTitle>
          <CardDescription>
            Use OWNER, EASYCOIN, AUDITOR, or LEGAL_ADMIN to read contract records. Admin can inspect reporting,
            subscriptions, holdings, settlements, payments, and redemptions from their dedicated pages.
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}

export default function PropertiesPage() {
  const { session, ready } = useSession();
  const [form, setForm] = React.useState<DraftFormState>(initialFormState);
  const [drafts, setDrafts] = React.useState<DraftRecord[]>([]);
  const [validatedContracts, setValidatedContracts] = React.useState<DraftRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ownerIdCopied, setOwnerIdCopied] = React.useState(false);
  const [propertyProfileForm, setPropertyProfileForm] = React.useState<PropertyProfileFormState>(
    initialPropertyProfileForm,
  );
  const [creatingProperty, setCreatingProperty] = React.useState(false);
  const [propertyProfileCreated, setPropertyProfileCreated] = React.useState(false);
  const [propertyProfileId, setPropertyProfileId] = React.useState<string | null>(null);
  const [myProperties, setMyProperties] = React.useState<BackendProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = React.useState<BackendProperty | null>(null);
  const [propertyDetailsLoading, setPropertyDetailsLoading] = React.useState(false);

  const handleCopyOwnerId = async () => {
    await navigator.clipboard.writeText(session.partyId);
    setOwnerIdCopied(true);
    window.setTimeout(() => setOwnerIdCopied(false), 1600);
  };

  const loadOwnerData = React.useCallback(async () => {
    if (!session.accessToken) return;

    setError(null);
    setLoading(true);

    try {
      const [draftResponse, validatedResponse, propertyResponse] = await Promise.all([
        getOwnerDrafts(session.accessToken),
        getValidatedContracts(session.accessToken),
        getMyProperties(session.accessToken),
      ]);

      const nextDrafts = draftResponse
        .map((event) => normalizeDraftRecord(event, 'Draft'))
        .filter(Boolean) as DraftRecord[];
      const nextValidatedContracts = validatedResponse
        .map((event) => normalizeDraftRecord(event, 'Validated'))
        .filter(Boolean) as DraftRecord[];

      setDrafts(nextDrafts);
      setValidatedContracts(nextValidatedContracts);
      setMyProperties(propertyResponse);

      const existingRecords = [...nextDrafts, ...nextValidatedContracts];
      const firstProperty = propertyResponse[0];
      setSelectedPropertyId(firstProperty?.propertyId ?? null);
      setPropertyProfileId(firstProperty?.propertyId ?? null);
      setPropertyProfileCreated(Boolean(firstProperty));
      setForm((current) => ({
        ...current,
        contractId: nextSequenceId('MPC', existingRecords.map((item) => item.contractId)),
        propertyId: firstProperty?.propertyId ?? nextSequenceId('PROP', [
          ...existingRecords.map((item) => item.propertyId),
          ...propertyResponse.map((item) => item.propertyId),
        ]),
        propertyName: firstProperty?.name ?? current.propertyName,
        expectedRentalIncome: firstProperty?.expectedRentalIncome?.toString() ?? current.expectedRentalIncome,
        expectedExpenses: firstProperty?.expectedExpenses?.toString() ?? current.expectedExpenses,
        currency: firstProperty?.currency ?? current.currency,
      }));
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Unable to load owner data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  React.useEffect(() => {
    if (!ready || session.role !== 'OWNER') return;
    void loadOwnerData();
  }, [loadOwnerData, ready, session.role]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadOwnerData();
      toast.success('Owner workspace refreshed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyProfileCreated) {
      toast.error('Create the property profile first');
      return;
    }
    setSaving(true);

    try {
      const payload: OwnerDraftPayload = {
        contractId: form.contractId.trim(),
        propertyId: propertyProfileId ?? form.propertyId.trim(),
        propertyName: form.propertyName.trim(),
        financialPeriod: form.financialPeriod.trim(),
        expectedRentalIncome: toNumber(form.expectedRentalIncome),
        expectedExpenses: toNumber(form.expectedExpenses),
        reportFrequency: form.reportFrequency.trim(),
        easycoinFeeRate: toNumber(form.easycoinFeeRate),
        ownerProfitShareOffered: toNumber(form.ownerProfitShareOffered),
        ownerRetainedShare: toNumber(form.ownerRetainedShare),
        expectedInvestorSettlement: toNumber(form.expectedInvestorSettlement),
        expectedUpfrontFunding: toNumber(form.expectedUpfrontFunding),
        currency: form.currency.trim().toUpperCase(),
      };

      await createOwnerDraft(session.accessToken, payload);
      toast.success(`Draft ${payload.contractId} created`);
      await loadOwnerData();
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : 'Unable to create draft';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenProperty = async (property: BackendProperty) => {
    setSelectedProperty(property);
    setPropertyDetailsLoading(true);
    try {
      const details = await getPropertyDetails(session.accessToken, property.propertyId);
      setSelectedProperty(details);
    } catch (propertyError) {
      toast.error(propertyError instanceof Error ? propertyError.message : 'Unable to load property details');
    } finally {
      setPropertyDetailsLoading(false);
    }
  };

  const handlePropertySelection = (propertyId: string) => {
    const property = myProperties.find((item) => item.propertyId === propertyId);
    if (!property) return;

    setSelectedPropertyId(property.propertyId);
    setPropertyProfileId(property.propertyId);
    setPropertyProfileCreated(true);
    setForm((current) => ({
      ...current,
      propertyId: property.propertyId,
      propertyName: property.name,
      expectedRentalIncome: property.expectedRentalIncome?.toString() ?? current.expectedRentalIncome,
      expectedExpenses: property.expectedExpenses?.toString() ?? current.expectedExpenses,
      currency: property.currency ?? current.currency,
    }));
  };

  const handleCreatePropertyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingProperty(true);

    try {
      const requestedPropertyId = form.propertyId.trim();
      const usedPropertyIds = [
        ...myProperties.map((property) => property.propertyId),
        ...drafts.map((draft) => draft.propertyId),
        ...validatedContracts.map((contract) => contract.propertyId),
      ];
      const propertyId = usedPropertyIds.includes(requestedPropertyId)
        ? nextSequenceId('PROP', usedPropertyIds)
        : requestedPropertyId;

      if (propertyId !== requestedPropertyId) {
        setForm((current) => ({ ...current, propertyId }));
      }

      const createdProperty = await createPropertyProfile(session.accessToken, {
        propertyId,
        name: form.propertyName.trim(),
        description: propertyProfileForm.description.trim() || undefined,
        propertyType: propertyProfileForm.propertyType.trim() || undefined,
        address: propertyProfileForm.address.trim() || undefined,
        city: propertyProfileForm.city.trim() || undefined,
        country: propertyProfileForm.country.trim() || undefined,
        surfaceArea: propertyProfileForm.surfaceArea
          ? toNumber(propertyProfileForm.surfaceArea)
          : undefined,
        rooms: propertyProfileForm.rooms ? toNumber(propertyProfileForm.rooms) : undefined,
        bedrooms: propertyProfileForm.bedrooms ? toNumber(propertyProfileForm.bedrooms) : undefined,
        bathrooms: propertyProfileForm.bathrooms ? toNumber(propertyProfileForm.bathrooms) : undefined,
        expectedRentalIncome: toNumber(form.expectedRentalIncome),
        expectedExpenses: toNumber(form.expectedExpenses),
        currency: form.currency.trim().toUpperCase(),
      });
      setPropertyProfileCreated(true);
      setPropertyProfileId(propertyId);
      setSelectedPropertyId(propertyId);
      setMyProperties((current) => [createdProperty, ...current.filter((item) => item.propertyId !== propertyId)]);
      toast.success(`Property profile ${form.propertyName.trim()} created`);
    } catch (propertyError) {
      if (propertyError instanceof BackendApiError && propertyError.status === 409) {
        setPropertyProfileCreated(true);
        setPropertyProfileId(form.propertyId.trim());
        toast.success('This property profile already exists. You can continue to the draft.');
        return;
      }
      const message =
        propertyError instanceof Error ? propertyError.message : 'Unable to create property profile';
      toast.error(message);
    } finally {
      setCreatingProperty(false);
    }
  };

  const draftCount = drafts.length;
  const validatedCount = validatedContracts.length;
  const totalTargetFunding = drafts.reduce((sum, item) => sum + item.expectedUpfrontFunding, 0);
  const totalInvestorSettlement = drafts.reduce((sum, item) => sum + item.expectedInvestorSettlement, 0);
  const latestDraft = [...drafts, ...validatedContracts].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  })[0];

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session.role !== 'OWNER') {
    if (session.role === 'EASYCOIN') {
      return (
        <>
          <EasycoinDraftReview token={session.accessToken} />
          <PropertiesDirectory token={session.accessToken} />
        </>
      );
    }

    if (session.role === 'AUDITOR') {
      return <AuditorContractReview token={session.accessToken} />;
    }

    if (session.role === 'LEGAL_ADMIN') {
      return <AuditorContractReview token={session.accessToken} roleLabel="Legal admin" />;
    }

    if (session.role === 'ADMIN') {
      return (
        <>
          <PageHeader
            title="Property directory"
            description="Review all property profiles returned by the backend."
          />
          <PropertiesDirectory token={session.accessToken} />
        </>
      );
    }

    return (
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-xl">Owner workspace</CardTitle>
          <CardDescription>
            This screen is reserved for the OWNER role.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sign in as an owner to create and track managed contract drafts.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Owner workspace"
        description="Create the managed contract draft, track validation status, and follow the lifecycle from draft to settlement."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
        <Button size="sm" className="gap-2" asChild>
          <Link href={propertyProfileCreated ? '#owner-draft-form' : '#owner-property-form'}>
            <ArrowRight className="h-4 w-4" />
            {propertyProfileCreated ? 'Create draft' : 'Start property profile'}
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Active drafts</CardDescription>
            <CardTitle className="text-2xl">{draftCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Owner-submitted drafts in the current ledger view.
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Validated contracts</CardDescription>
            <CardTitle className="text-2xl">{validatedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Contracts ready for the next Easycoin workflow step.
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Total funding target</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalTargetFunding)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Aggregate upfront funding across active drafts.
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Expected investor settlement</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalInvestorSettlement)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Future profit share targeted for investors.
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-primary/15 bg-gradient-to-r from-primary/[0.04] via-background to-background">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          {[
            {
              number: '01',
              title: 'Property profile',
              description: 'Save the property information.',
              complete: propertyProfileCreated,
            },
            {
              number: '02',
              title: 'Contract draft',
              description: 'Add the financial terms.',
              complete: false,
            },
            {
              number: '03',
              title: 'Easycoin review',
              description: 'Submit the draft for validation.',
              complete: false,
            },
          ].map((step, index) => (
            <div key={step.number} className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.complete || (index === 1 && propertyProfileCreated)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.complete ? '✓' : step.number}
              </div>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4 border-border/70">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">My property profiles</CardTitle>
          <CardDescription>
            Properties returned by your authenticated owner account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myProperties.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
              No property profile has been created yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myProperties.map((property) => (
                <button
                  key={property.propertyId}
                  type="button"
                  onClick={() => void handleOpenProperty(property)}
                  className="rounded-xl border border-border/70 bg-background/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{property.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{property.propertyId}</p>
                    </div>
                    <StatusBadge status={property.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {[property.city, property.country].filter(Boolean).join(', ') || 'Location not provided'}
                  </p>
                  <p className="mt-3 text-xs font-medium text-primary">View property details →</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card id="owner-property-form" className="border-border/70">
          <CardHeader className="space-y-2 border-b border-border/60">
            <CardTitle className="text-xl">Create property profile</CardTitle>
            <CardDescription>
              Save the property information before submitting its contract draft.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreatePropertyProfile}>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="profilePropertyName">Property name</Label>
                <Input
                  id="profilePropertyName"
                  value={form.propertyName}
                  onChange={(e) => setForm((current) => ({ ...current, propertyName: e.target.value }))}
                  placeholder="Enter the property name"
                />
                <p className="text-xs text-muted-foreground">
                  You can update the property name before creating the profile.
                </p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="profileDescription">Description</Label>
                <Textarea
                  id="profileDescription"
                  placeholder="Describe the property for future investors..."
                  value={propertyProfileForm.description}
                  onChange={(e) => setPropertyProfileForm((current) => ({ ...current, description: e.target.value }))}
                  className="min-h-[88px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profilePropertyType">Property type</Label>
                <Input
                  id="profilePropertyType"
                  value={propertyProfileForm.propertyType}
                  onChange={(e) => setPropertyProfileForm((current) => ({ ...current, propertyType: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileAddress">Address</Label>
                <Input
                  id="profileAddress"
                  placeholder="Neighbourhood or street"
                  value={propertyProfileForm.address}
                  onChange={(e) => setPropertyProfileForm((current) => ({ ...current, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileCity">City</Label>
                <Input
                  id="profileCity"
                  value={propertyProfileForm.city}
                  onChange={(e) => setPropertyProfileForm((current) => ({ ...current, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileCountry">Country</Label>
                <Input
                  id="profileCountry"
                  value={propertyProfileForm.country}
                  onChange={(e) => setPropertyProfileForm((current) => ({ ...current, country: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileSurfaceArea">Surface area (m²)</Label>
                <Input
                  id="profileSurfaceArea"
                  type="number"
                  min="0"
                  value={propertyProfileForm.surfaceArea}
                  onChange={(e) => setPropertyProfileForm((current) => ({ ...current, surfaceArea: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileRooms">Rooms</Label>
                <Input
                  id="profileRooms"
                  type="number"
                  min="0"
                  value={propertyProfileForm.rooms}
                  onChange={(e) => setPropertyProfileForm((current) => ({ ...current, rooms: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileBedrooms">Bedrooms</Label>
                <Input
                  id="profileBedrooms"
                  type="number"
                  min="0"
                  value={propertyProfileForm.bedrooms}
                  onChange={(e) => setPropertyProfileForm((current) => ({ ...current, bedrooms: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileBathrooms">Bathrooms</Label>
                <Input
                  id="profileBathrooms"
                  type="number"
                  min="0"
                  value={propertyProfileForm.bathrooms}
                  onChange={(e) => setPropertyProfileForm((current) => ({ ...current, bathrooms: e.target.value }))}
                />
              </div>
            </CardContent>
            <div className="flex flex-col gap-3 border-t border-border/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">The profile will be linked to the generated property ID.</p>
              <Button type="submit" className="gap-2" disabled={creatingProperty || !form.propertyId.trim()}>
                {creatingProperty && <Loader2 className="h-4 w-4 animate-spin" />}
                {creatingProperty ? 'Creating profile...' : 'Create property profile'}
              </Button>
            </div>
          </form>
        </Card>

        <Card
          id="owner-draft-form"
          className={`border-border/70 ${!propertyProfileCreated ? 'opacity-70' : ''}`}
        >
          <CardHeader className="space-y-3 border-b border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Managed contract draft
              </Badge>
              <button
                type="button"
                onClick={handleCopyOwnerId}
                className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-accent"
                title="Copy full owner party ID"
                aria-label="Copy full owner party ID"
              >
                {ownerIdCopied ? 'Copied' : 'OWNER'}
              </button>
            </div>
            <div>
              <CardTitle className="text-xl">Create a new draft</CardTitle>
              <CardDescription>
                {propertyProfileCreated
                  ? 'Now add the financial terms for your managed contract.'
                  : 'Complete the property profile above to unlock this step.'}
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleCreateDraft}>
            <fieldset className="min-w-0 border-0 p-0" disabled={!propertyProfileCreated || saving}>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="draftProperty">Choose a property</Label>
                <Select value={selectedPropertyId ?? ''} onValueChange={handlePropertySelection}>
                  <SelectTrigger id="draftProperty">
                    <SelectValue placeholder="Select one of your properties" />
                  </SelectTrigger>
                  <SelectContent>
                    {myProperties.map((property) => (
                      <SelectItem key={property.propertyId} value={property.propertyId}>
                        {property.name} ({property.propertyId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The contract draft will be linked to the selected property profile.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="financialPeriod">Financial period</Label>
                <Input
                  id="financialPeriod"
                  value={form.financialPeriod}
                  onChange={(e) => setForm((current) => ({ ...current, financialPeriod: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportFrequency">Report frequency</Label>
                <Select
                  value={form.reportFrequency}
                  onValueChange={(value) => setForm((current) => ({ ...current, reportFrequency: value }))}
                >
                  <SelectTrigger id="reportFrequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={(e) => setForm((current) => ({ ...current, currency: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="easycoinFeeRate">Easycoin fee rate</Label>
                <Input
                  id="easycoinFeeRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.easycoinFeeRate}
                  onChange={(e) => setForm((current) => ({ ...current, easycoinFeeRate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerProfitShareOffered">Owner profit share offered</Label>
                <Input
                  id="ownerProfitShareOffered"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.ownerProfitShareOffered}
                  onChange={(e) => setForm((current) => ({ ...current, ownerProfitShareOffered: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerRetainedShare">Owner retained share</Label>
                <Input
                  id="ownerRetainedShare"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.ownerRetainedShare}
                  onChange={(e) => setForm((current) => ({ ...current, ownerRetainedShare: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedRentalIncome">Expected rental income</Label>
                <Input
                  id="expectedRentalIncome"
                  type="number"
                  min="0"
                  value={form.expectedRentalIncome}
                  onChange={(e) => setForm((current) => ({ ...current, expectedRentalIncome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedExpenses">Expected expenses</Label>
                <Input
                  id="expectedExpenses"
                  type="number"
                  min="0"
                  value={form.expectedExpenses}
                  onChange={(e) => setForm((current) => ({ ...current, expectedExpenses: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedInvestorSettlement">Expected investor settlement</Label>
                <Input
                  id="expectedInvestorSettlement"
                  type="number"
                  min="0"
                  value={form.expectedInvestorSettlement}
                  onChange={(e) => setForm((current) => ({ ...current, expectedInvestorSettlement: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedUpfrontFunding">Expected upfront funding</Label>
                <Input
                  id="expectedUpfrontFunding"
                  type="number"
                  min="0"
                  value={form.expectedUpfrontFunding}
                  onChange={(e) => setForm((current) => ({ ...current, expectedUpfrontFunding: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="ownerNote">Owner note</Label>
                <Textarea
                  id="ownerNote"
                  value="This draft creates a managed property profit participation contract. The owner keeps the property while investors fund future rental profits."
                  readOnly
                  className="mt-2 min-h-[96px] bg-muted/30"
                />
              </div>
              </CardContent>
              <div className="flex flex-col gap-3 border-t border-border/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Review the details above, then submit your draft for Easycoin review.
                </p>
                <Button type="submit" className="gap-2" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Creating draft...' : 'Submit draft'}
                </Button>
              </div>
            </fieldset>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Owner workflow</CardTitle>
              <CardDescription>The lifecycle owner sees before Easycoin validation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {workflowSteps.map((step) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3 rounded-xl border border-border/60 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Latest contract snapshot</CardTitle>
              <CardDescription>Quick read of the newest owner-side record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestDraft ? (
                <>
                  <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Contract</p>
                    <p className="mt-2 text-sm font-medium">{latestDraft.contractId}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Property</p>
                      <p className="mt-2 text-sm font-medium">{latestDraft.propertyName}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                      <div className="mt-2">
                        <StatusBadge status={latestDraft.status} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected funding</p>
                      <p className="mt-2 text-sm font-medium">{formatCurrency(latestDraft.expectedUpfrontFunding)}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected settlement</p>
                      <p className="mt-2 text-sm font-medium">{formatCurrency(latestDraft.expectedInvestorSettlement)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                  No owner draft is loaded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <Card className="mt-6 border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 px-6 py-4 text-sm text-destructive">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 space-y-4">
        <DraftTable
          title="Active drafts"
          description="Owner-submitted drafts waiting for Easycoin review."
          rows={drafts}
          emptyLabel="No active draft found yet. Create the first managed contract draft above."
          badgeLabel="Owner drafts"
        />

        <DraftTable
          title="Validated contracts"
          description="Contracts approved by Easycoin and ready for the next workflow step."
          rows={validatedContracts}
          emptyLabel="No validated contract yet."
          badgeLabel="Validated"
        />
      </div>

      <Dialog open={Boolean(selectedProperty)} onOpenChange={(open) => !open && setSelectedProperty(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedProperty && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle>{selectedProperty.name}</DialogTitle>
                  <StatusBadge status={selectedProperty.status} />
                </div>
                <DialogDescription>
                  Complete property profile details for {selectedProperty.propertyId}.
                </DialogDescription>
              </DialogHeader>

              {propertyDetailsLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading complete property details...
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Property ID</p>
                  <p className="mt-2 font-medium">{selectedProperty.propertyId}</p>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Property type</p>
                  <p className="mt-2 font-medium">{selectedProperty.propertyType || 'Not provided'}</p>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Location</p>
                  <p className="mt-2 font-medium">
                    {[selectedProperty.address, selectedProperty.city, selectedProperty.country]
                      .filter(Boolean)
                      .join(', ') || 'Not provided'}
                  </p>
                </div>
                {selectedProperty.images && selectedProperty.images.length > 0 && (
                  <div className="rounded-xl border border-border/70 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Images</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {selectedProperty.images.map((image) => (
                        <a
                          key={image.id ?? image.url}
                          href={image.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40"
                        >
                          <img src={image.url} alt={image.caption || selectedProperty.name} className="h-36 w-full object-cover transition-transform group-hover:scale-[1.02]" />
                          <span className="block truncate px-3 py-2 text-sm text-primary">{image.caption || image.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProperty.rentalHistory && selectedProperty.rentalHistory.length > 0 && (
                  <div className="rounded-xl border border-border/70 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Rental history</p>
                    <div className="mt-3 space-y-2">
                      {selectedProperty.rentalHistory.map((history) => (
                        <div key={history.id ?? history.periodLabel} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm">
                          <span className="font-medium">{history.periodLabel}</span>
                          <span>{formatCurrency(history.rentalIncome)}</span>
                          <span className="text-muted-foreground">Expenses: {formatCurrency(history.expenses ?? 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProperty.documents && selectedProperty.documents.length > 0 && (
                  <div className="rounded-xl border border-border/70 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Documents</p>
                    <div className="mt-3 space-y-2">
                      {selectedProperty.documents.map((document) => (
                        <a
                          key={document.id ?? document.url}
                          href={document.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-border/60 px-3 py-2 text-sm text-primary hover:bg-muted/40"
                        >
                          {document.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Surface area</p>
                  <p className="mt-2 font-medium">
                    {selectedProperty.surfaceArea != null ? `${selectedProperty.surfaceArea} m²` : 'Not provided'}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Rooms</p>
                  <p className="mt-2 font-medium">{selectedProperty.rooms ?? 'Not provided'}</p>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Bedrooms / bathrooms</p>
                  <p className="mt-2 font-medium">
                    {selectedProperty.bedrooms ?? '—'} / {selectedProperty.bathrooms ?? '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Currency</p>
                  <p className="mt-2 font-medium">{selectedProperty.currency || 'MAD'}</p>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected rental income</p>
                  <p className="mt-2 font-medium">
                    {selectedProperty.expectedRentalIncome != null
                      ? formatCurrency(selectedProperty.expectedRentalIncome)
                      : 'Not provided'}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected expenses</p>
                  <p className="mt-2 font-medium">
                    {selectedProperty.expectedExpenses != null
                      ? formatCurrency(selectedProperty.expectedExpenses)
                      : 'Not provided'}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Description</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {selectedProperty.description || 'No description provided.'}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground sm:col-span-2">
                  Created {selectedProperty.createdAt ? new Date(selectedProperty.createdAt).toLocaleDateString() : '—'}
                  {selectedProperty.updatedAt && ` · Updated ${new Date(selectedProperty.updatedAt).toLocaleDateString()}`}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
