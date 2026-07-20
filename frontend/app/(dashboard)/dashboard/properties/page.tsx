'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { useSession } from '@/lib/session';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  rawContractId: string;
};

type EasycoinDraftReviewProps = {
  token: string;
};

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

const initialFormState: DraftFormState = {
  contractId: 'MPC-001',
  propertyId: 'PROP-001',
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
    rawContractId: String(raw.contractId ?? contractId),
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
      <CardContent className="p-0">
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
                    <div className="flex flex-col gap-1">
                      <span>{row.contractId}</span>
                      <span className="text-xs text-muted-foreground">{row.rawContractId}</span>
                    </div>
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
        title="Easycoin draft review"
        description="Review owner submissions, validate correct contracts, and reject drafts that need correction."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
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

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/70">
          <CardHeader className="space-y-2 border-b border-border/60">
            <CardTitle className="text-lg">Draft queue</CardTitle>
            <CardDescription>Validate the correct business case, or reject it with a reason.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
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
              drafts.map((draft) => (
                <div key={draft.contractId} className="rounded-2xl border border-border/60 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {draft.contractId}
                        </Badge>
                        <StatusBadge status={draft.status} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold">{draft.propertyName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {draft.propertyId} • {draft.financialPeriod} • {draft.reportFrequency}
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Income</p>
                          <p className="mt-1 font-medium">{formatCurrency(draft.expectedRentalIncome)}</p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Expenses</p>
                          <p className="mt-1 font-medium">{formatCurrency(draft.expectedExpenses)}</p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Upfront funding</p>
                          <p className="mt-1 font-medium">{formatCurrency(draft.expectedUpfrontFunding)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 lg:w-48">
                      <Button
                        className="gap-2"
                        onClick={() => handleValidate(draft.contractId)}
                        disabled={pendingAction === draft.contractId}
                      >
                        {pendingAction === draft.contractId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Validate
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor={`reject-${draft.contractId}`}>Reject reason</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id={`reject-${draft.contractId}`}
                        placeholder="The submitted contract data is incomplete."
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
                        className="gap-2"
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
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Validated contracts</CardTitle>
            <CardDescription>Ready to use for investor approval and token creation.</CardDescription>
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

export default function PropertiesPage() {
  const { session, ready } = useSession();
  const [form, setForm] = React.useState<DraftFormState>(initialFormState);
  const [drafts, setDrafts] = React.useState<DraftRecord[]>([]);
  const [validatedContracts, setValidatedContracts] = React.useState<DraftRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadOwnerData = React.useCallback(async () => {
    if (!session.accessToken) return;

    setError(null);
    setLoading(true);

    try {
      const [draftResponse, validatedResponse] = await Promise.all([
        getOwnerDrafts(session.accessToken),
        getValidatedContracts(session.accessToken),
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
    setSaving(true);

    try {
      const payload: OwnerDraftPayload = {
        contractId: form.contractId.trim(),
        propertyId: form.propertyId.trim(),
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

  const draftCount = drafts.length;
  const validatedCount = validatedContracts.length;
  const totalTargetFunding = drafts.reduce((sum, item) => sum + item.expectedUpfrontFunding, 0);
  const totalInvestorSettlement = drafts.reduce((sum, item) => sum + item.expectedInvestorSettlement, 0);
  const latestDraft = drafts[0] ?? validatedContracts[0];

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session.role !== 'OWNER') {
    if (session.role === 'EASYCOIN') {
      return <EasycoinDraftReview token={session.accessToken} />;
    }

    if (session.role === 'AUDITOR') {
      return <AuditorContractReview token={session.accessToken} />;
    }

    if (session.role === 'LEGAL_ADMIN') {
      return <AuditorContractReview token={session.accessToken} roleLabel="Legal admin" />;
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
          <Link href="#owner-draft-form">
            <ArrowRight className="h-4 w-4" />
            Create draft
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

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card id="owner-draft-form" className="border-border/70">
          <CardHeader className="space-y-3 border-b border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Managed contract draft
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Owner: {session.partyId}
              </Badge>
            </div>
            <div>
              <CardTitle className="text-xl">Create a new draft</CardTitle>
              <CardDescription>
                Use business IDs and financial terms. The backend takes the owner party from your JWT.
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleCreateDraft}>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contractId">Contract ID</Label>
                <Input
                  id="contractId"
                  value={form.contractId}
                  onChange={(e) => setForm((current) => ({ ...current, contractId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property ID</Label>
                <Input
                  id="propertyId"
                  value={form.propertyId}
                  onChange={(e) => setForm((current) => ({ ...current, propertyId: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="propertyName">Property name</Label>
                <Input
                  id="propertyName"
                  value={form.propertyName}
                  onChange={(e) => setForm((current) => ({ ...current, propertyName: e.target.value }))}
                />
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
                <Input
                  id="reportFrequency"
                  value={form.reportFrequency}
                  onChange={(e) => setForm((current) => ({ ...current, reportFrequency: e.target.value }))}
                />
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
                The backend ignores legacy party fields and uses your authenticated owner identity.
              </p>
              <Button type="submit" className="gap-2" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {saving ? 'Creating draft...' : 'Submit draft'}
              </Button>
            </div>
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
    </>
  );
}
