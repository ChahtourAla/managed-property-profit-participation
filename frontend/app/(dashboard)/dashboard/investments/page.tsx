'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, Coins, Copy, Loader2, PlusCircle, RefreshCw, ShieldCheck, UserRound, Users } from 'lucide-react';

import { investments, type Investment } from '@/lib/mock-investments';
import { formatCurrency, formatDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import { getProperties } from '@/lib/backend-api';
import {
  approveInvestor,
  confirmFunding,
  createSubscription,
  createInstrument,
  getApprovedInvestors,
  getDamlCreateArguments,
  getHoldingByCid,
  getHoldings,
  getHoldingsByHolder,
  getHoldingsByInstrument,
  getInstrumentById,
  getInstrumentSupply,
  getInstruments,
  getPaymentRewards,
  getRewardPaymentConfirmations,
  getSubscriptionFundingConfirmations,
  getSubscriptions,
  getValidatedContracts,
  toNumber,
  toStringValue,
} from '@/lib/platform-api';
import { demoUsers, localDamlParties } from '@/lib/role-config';
import { PageHeader } from '@/components/dashboard/page-header';
import { SearchInput } from '@/components/dashboard/search-input';
import { FilterBar, type FilterOption } from '@/components/dashboard/filter-bar';
import { DataTable, type Column } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const statusOptions: FilterOption[] = [
  { label: 'Approved', value: 'Approved' },
  { label: 'Subscribed', value: 'Subscribed' },
  { label: 'Funding pending', value: 'Funding pending' },
  { label: 'Funded', value: 'Funded' },
  { label: 'Tokens issued', value: 'Tokens issued' },
  { label: 'Reward pending', value: 'Reward pending' },
  { label: 'Paid', value: 'Paid' },
];

type ApprovedInvestorRecord = {
  contractId: string;
  investor: string;
  approvalReference: string;
};

type ApprovedInvestorOption = {
  investor: string;
  approvalReferences: string[];
};

function groupApprovedInvestors(records: ApprovedInvestorRecord[]): ApprovedInvestorOption[] {
  const grouped = new Map<string, string[]>();

  records.forEach((record) => {
    const references = grouped.get(record.investor) ?? [];
    if (record.approvalReference && !references.includes(record.approvalReference)) {
      references.push(record.approvalReference);
    }
    grouped.set(record.investor, references);
  });

  return Array.from(grouped, ([investor, approvalReferences]) => ({ investor, approvalReferences }));
}

type InstrumentRecord = {
  contractId: string;
  contractBusinessId?: string;
  propertyId?: string;
  propertyName?: string;
  instrumentId: string;
  totalUnits: number;
  ownerRetainedUnits?: number;
  investorOfferedUnits?: number;
  nominalValuePerUnit: number;
  investorUpfrontPricePerUnit: number;
  approvedInvestors: string[];
  status?: string;
};

type ValidatedContractRecord = {
  contractId: string;
  businessContractId: string;
  propertyName: string;
  propertyId: string;
};

const sampleInvestors = [
  demoUsers.INVESTOR,
  {
    role: 'INVESTOR',
    name: 'Investor Two',
    email: 'investor2@test.com',
    initials: 'IN',
    partyId: localDamlParties.investor2,
  },
  {
    role: 'INVESTOR',
    name: 'Investor Three',
    email: 'investor3@test.com',
    initials: 'IN',
    partyId: localDamlParties.investor3,
  },
] as const;

function nextInstrumentId(values: string[]) {
  const max = values.reduce((currentMax, value) => {
    const match = value.match(/^INSTR-MPC-(\d+)$/i);
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);

  return `INSTR-MPC-${String(max + 1).padStart(3, '0')}`;
}

function nextApprovalReference(records: ApprovedInvestorRecord[]) {
  const max = records.reduce((currentMax, record) => {
    const match = record.approvalReference.match(/^KYC-APPROVAL-(\d+)$/i);
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);

  return `KYC-APPROVAL-${String(max + 1).padStart(3, '0')}`;
}

function EasycoinInvestmentsWorkspace({ token }: { token: string }) {
  const [approvedInvestors, setApprovedInvestors] = React.useState<ApprovedInvestorRecord[]>([]);
  const [validatedContracts, setValidatedContracts] = React.useState<ValidatedContractRecord[]>([]);
  const [instruments, setInstruments] = React.useState<InstrumentRecord[]>([]);
  const [selectedContractId, setSelectedContractId] = React.useState('');
  const [selectedApprovedInvestors, setSelectedApprovedInvestors] = React.useState<string[]>([]);
  const [selectedInstrument, setSelectedInstrument] = React.useState<InstrumentRecord | null>(null);
  const [instrumentDetailsLoading, setInstrumentDetailsLoading] = React.useState(false);
  const [instrumentPage, setInstrumentPage] = React.useState(1);
  const [copiedInvestorId, setCopiedInvestorId] = React.useState<string | null>(null);
  const [approvalInvestor, setApprovalInvestor] = React.useState(sampleInvestors[0].partyId);
  const [instrumentForm, setInstrumentForm] = React.useState({
    contractId: '',
    instrumentId: '',
    totalUnits: '1000',
    nominalValuePerUnit: '76.8',
    investorUpfrontPricePerUnit: '68',
  });
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [investorResponse, validatedResponse, instrumentResponse, propertyResponse] = await Promise.all([
        getApprovedInvestors(token),
        getValidatedContracts(token),
        getInstruments(token),
        getProperties(token),
      ]);

      const normalizedApproved = investorResponse.map((event) => {
        const createArguments = getDamlCreateArguments<{ investor?: unknown; approvalReference?: unknown }>(
          { contractId: String(event.contractId), createArguments: event.createArguments }
        );
        return {
          contractId: String(event.contractId),
          investor: toStringValue(createArguments.investor, ''),
          approvalReference: toStringValue(createArguments.approvalReference, ''),
        };
      }).filter((item) => item.investor);

      const normalizedValidated = validatedResponse.map((event) => {
        const validatedArguments = getDamlCreateArguments<Record<string, unknown> & { contractData?: Record<string, unknown> }>({
          contractId: String(event.contractId),
          createArguments: event.createArguments,
        });
        const contractData: Record<string, unknown> = validatedArguments.contractData ?? validatedArguments;
        return {
          contractId: String(event.contractId),
          businessContractId: toStringValue(contractData.contractId, ''),
          propertyName: toStringValue(contractData.propertyName, 'Managed property'),
          propertyId: toStringValue(contractData.propertyId, ''),
        };
      }).filter((item) => item.contractId);

      const propertyNameById = new Map([
        ...normalizedValidated.map((item) => [item.propertyId, item.propertyName] as const),
        ...propertyResponse.map((property) => [property.propertyId, property.name] as const),
      ]);

      const normalizedInstruments = instrumentResponse.map((event) => {
        const args = getDamlCreateArguments<{
          contractId?: unknown;
          propertyId?: unknown;
          instrumentId?: unknown;
          totalUnits?: unknown;
          ownerRetainedUnits?: unknown;
          investorOfferedUnits?: unknown;
          nominalValuePerUnit?: unknown;
          investorUpfrontPricePerUnit?: unknown;
          approvedInvestors?: unknown;
          status?: unknown;
        }>({ contractId: String(event.contractId), createArguments: event.createArguments });

        const propertyId = toStringValue(args.propertyId, '');

        return {
          contractId: String(event.contractId),
          contractBusinessId: toStringValue(args.contractId, ''),
          propertyId,
          propertyName: propertyNameById.get(propertyId) ?? 'Property name unavailable',
          instrumentId: toStringValue(args.instrumentId, ''),
          totalUnits: toNumber(args.totalUnits),
          ownerRetainedUnits: toNumber(args.ownerRetainedUnits),
          investorOfferedUnits: toNumber(args.investorOfferedUnits),
          nominalValuePerUnit: toNumber(args.nominalValuePerUnit),
          investorUpfrontPricePerUnit: toNumber(args.investorUpfrontPricePerUnit),
          approvedInvestors: Array.isArray(args.approvedInvestors)
            ? (args.approvedInvestors as unknown[]).map((item) => String(item))
            : [],
          status: toStringValue(args.status, 'SUBSCRIPTION_OPEN'),
        };
      }).filter((item) => item.instrumentId);

      setApprovedInvestors(normalizedApproved as ApprovedInvestorRecord[]);
      setValidatedContracts(normalizedValidated as ValidatedContractRecord[]);
      setInstruments(normalizedInstruments as InstrumentRecord[]);
      setInstrumentForm((current) => ({
        ...current,
        instrumentId: nextInstrumentId(normalizedInstruments.map((item) => item.instrumentId)),
      }));

      if (!selectedContractId && normalizedValidated[0]) {
        setSelectedContractId(normalizedValidated[0].businessContractId);
        setInstrumentForm((current) => ({
          ...current,
          contractId: normalizedValidated[0].businessContractId || current.contractId,
        }));
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load Easycoin data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [selectedContractId, token]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast.success('Easycoin workspace refreshed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleApproveInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const approvalReference = nextApprovalReference(approvedInvestors);
      await approveInvestor(token, {
        investor: approvalInvestor,
        approvalReference,
      });
      toast.success('Investor approved');
      await loadData();
    } catch (approveError) {
      toast.error(approveError instanceof Error ? approveError.message : 'Unable to approve investor');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instrumentForm.contractId) {
      toast.error('Select a validated contract');
      return;
    }
    setSaving(true);
    try {
      await createInstrument(token, {
        contractId: instrumentForm.contractId,
        instrumentId: instrumentForm.instrumentId.trim(),
        totalUnits: toNumber(instrumentForm.totalUnits),
        nominalValuePerUnit: toNumber(instrumentForm.nominalValuePerUnit),
        investorUpfrontPricePerUnit: toNumber(instrumentForm.investorUpfrontPricePerUnit),
        approvedInvestors: selectedApprovedInvestors,
      });
      toast.success('Tokenized instrument created');
      await loadData();
    } catch (createError) {
      toast.error(createError instanceof Error ? createError.message : 'Unable to create instrument');
    } finally {
      setSaving(false);
    }
  };

  const approvedInvestorOptions = groupApprovedInvestors(approvedInvestors);

  const getInvestorName = (partyId: string) =>
    partyId.split('::')[0] || 'Investor';

  const copyInvestorId = async (partyId: string) => {
    await navigator.clipboard.writeText(partyId);
    setCopiedInvestorId(partyId);
    window.setTimeout(() => setCopiedInvestorId(null), 1600);
  };
  const instrumentsPerPage = 4;
  const instrumentPageCount = Math.max(1, Math.ceil(instruments.length / instrumentsPerPage));
  const visibleInstruments = instruments.slice(
    (instrumentPage - 1) * instrumentsPerPage,
    instrumentPage * instrumentsPerPage,
  );

  React.useEffect(() => {
    setInstrumentPage((current) => Math.min(current, instrumentPageCount));
  }, [instrumentPageCount]);

  const openInstrumentDetails = async (item: InstrumentRecord) => {
    setSelectedInstrument(item);
    setInstrumentDetailsLoading(true);
    try {
      const response = await getInstrumentById(token, item.instrumentId);
      const event = response[0];
      if (event) {
        const args = getDamlCreateArguments<{
          contractId?: unknown;
          propertyId?: unknown;
          instrumentId?: unknown;
          totalUnits?: unknown;
          ownerRetainedUnits?: unknown;
          investorOfferedUnits?: unknown;
          nominalValuePerUnit?: unknown;
          investorUpfrontPricePerUnit?: unknown;
          approvedInvestors?: unknown;
          status?: unknown;
        }>({ contractId: String(event.contractId), createArguments: event.createArguments });

        setSelectedInstrument({
          ...item,
          contractId: String(event.contractId),
          contractBusinessId: toStringValue(args.contractId, item.contractBusinessId),
          propertyId: toStringValue(args.propertyId, item.propertyId),
          instrumentId: toStringValue(args.instrumentId, item.instrumentId),
          totalUnits: toNumber(args.totalUnits, item.totalUnits),
          ownerRetainedUnits: toNumber(args.ownerRetainedUnits, item.ownerRetainedUnits ?? 0),
          investorOfferedUnits: toNumber(args.investorOfferedUnits, item.investorOfferedUnits ?? 0),
          nominalValuePerUnit: toNumber(args.nominalValuePerUnit, item.nominalValuePerUnit),
          investorUpfrontPricePerUnit: toNumber(args.investorUpfrontPricePerUnit, item.investorUpfrontPricePerUnit),
          approvedInvestors: Array.isArray(args.approvedInvestors)
            ? args.approvedInvestors.map((investor) => String(investor))
            : item.approvedInvestors,
          status: toStringValue(args.status, item.status ?? 'SUBSCRIPTION_OPEN'),
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load instrument details');
    } finally {
      setInstrumentDetailsLoading(false);
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
        title="Investment setup"
        description="Approve investors and prepare participation instruments from your validated contracts."
      >
        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-gradient-to-br from-primary/[0.06] to-background shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved investors</CardTitle>
            <div className="rounded-xl bg-primary/10 p-2 text-primary"><Users className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{approvedInvestorOptions.length}</span>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validated contracts</CardTitle>
            <div className="rounded-xl bg-muted p-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{validatedContracts.length}</span>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active instruments</CardTitle>
            <div className="rounded-xl bg-muted p-2 text-muted-foreground"><Coins className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{instruments.length}</span>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="mt-4 border-destructive/30 bg-destructive/5">
          <CardContent className="px-6 py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0 overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-sm">
          <CardHeader className="space-y-3 border-b border-border/60 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">Approve an investor</CardTitle>
              <CardDescription>Choose an investor to allow participation in future instruments.</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleApproveInvestor}>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="investor-party">Select investor</Label>
                <Select
                  value={approvalInvestor}
                  onValueChange={setApprovalInvestor}
                >
                  <SelectTrigger id="investor-party">
                    <SelectValue placeholder="Select investor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleInvestors.map((item) => (
                      <SelectItem
                        key={item.partyId}
                        value={item.partyId}
                      >
                        {item.partyId.split('::')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {getInvestorName(approvalInvestor).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{getInvestorName(approvalInvestor)}</p>
                      <p className="text-xs text-muted-foreground">Ready for approval</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Copy investor ID"
                    title="Copy investor ID"
                    className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => void copyInvestorId(approvalInvestor)}
                  >
                    {copiedInvestorId === approvalInvestor ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="h-11 w-full gap-2 shadow-sm"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Approve selected investor
              </Button>
            </CardContent>
          </form>
        </Card>

        <Card className="min-w-0 border-border/70">
          <CardHeader className="space-y-2 border-b border-border/60">
            <CardTitle className="text-lg">Create tokenized instrument</CardTitle>
            <CardDescription>Set the investment terms and choose who can participate.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateInstrument}>
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="validated-contract">Validated contract</Label>
                <Select
                  value={instrumentForm.contractId}
                  onValueChange={(value) =>
                    setInstrumentForm((current) => ({ ...current, contractId: value }))
                  }
                >
                  <SelectTrigger id="validated-contract">
                    <SelectValue placeholder="Select contract" />
                  </SelectTrigger>
                  <SelectContent>
                    {validatedContracts.map((contract) => (
                      <SelectItem key={contract.businessContractId || contract.contractId} value={contract.businessContractId || contract.contractId}>
                        {contract.businessContractId || contract.contractId} - {contract.propertyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-units">Units available</Label>
                <Input
                  id="total-units"
                  type="number"
                  min="0"
                  value={instrumentForm.totalUnits}
                  onChange={(e) => setInstrumentForm((current) => ({ ...current, totalUnits: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nominal-value">Nominal value per unit</Label>
                <Input
                  id="nominal-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={instrumentForm.nominalValuePerUnit}
                  onChange={(e) => setInstrumentForm((current) => ({ ...current, nominalValuePerUnit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upfront-price">Investor price per unit</Label>
                <Input
                  id="upfront-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={instrumentForm.investorUpfrontPricePerUnit}
                  onChange={(e) => setInstrumentForm((current) => ({ ...current, investorUpfrontPricePerUnit: e.target.value }))}
                />
              </div>
              <div className="space-y-3 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Choose approved investors</p>
                    <p className="text-xs text-muted-foreground">Select one or more eligible parties.</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedApprovedInvestors.length} selected
                  </Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {approvedInvestorOptions.map((item) => (
                    <label
                      key={item.investor}
                      className="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/40 hover:bg-accent/30"
                    >
                      <Checkbox
                        checked={selectedApprovedInvestors.includes(item.investor)}
                        onCheckedChange={(checked) =>
                          setSelectedApprovedInvestors((current) =>
                            checked
                              ? [...current, item.investor]
                              : current.filter((value) => value !== item.investor)
                          )
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-medium leading-5"
                          title={item.investor}
                        >
                          {getInvestorName(item.investor)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Copy ${getInvestorName(item.investor)} party ID`}
                        title="Copy investor ID"
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void copyInvestorId(item.investor);
                        }}
                      >
                        {copiedInvestorId === item.investor ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 px-6 py-5">
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">Review the details, then create the investment instrument.</p>
              <Button type="submit" className="shrink-0 gap-2" disabled={saving || validatedContracts.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Create instrument
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0 border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Approved investors</CardTitle>
            <CardDescription>Investor parties approved to participate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedInvestorOptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                No approved investor yet.
              </div>
            ) : (
              approvedInvestorOptions.map((item) => (
                <div key={item.investor} className="group rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/30 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium" title={item.investor}>
                          {getInvestorName(item.investor)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.approvalReferences.length} approval {item.approvalReferences.length === 1 ? 'reference' : 'references'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status="Approved" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
                    {item.approvalReferences.map((reference) => (
                      <span key={reference} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground" title={reference}>
                        {reference}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tokenized instruments</CardTitle>
            <CardDescription>Created instruments and supply snapshots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {instruments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                No instrument created yet.
              </div>
            ) : (
              visibleInstruments.map((item) => (
                <div
                  key={item.contractId}
                  role="button"
                  tabIndex={0}
                  onClick={() => void openInstrumentDetails(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void openInstrumentDetails(item);
                    }
                  }}
                  className="group min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/30 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <div className="flex min-w-0 flex-col items-start justify-between gap-3 sm:flex-row">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold tracking-tight" title={item.instrumentId}>{item.instrumentId}</p>
                        <p className="truncate text-xs text-muted-foreground" title={item.contractId}>
                          Contract {item.contractId.slice(0, 15)}...
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-muted-foreground" title={item.propertyName}>
                          {item.propertyName || 'Managed property'}
                        </p>
                      </div>
                    </div>
                    <div className="max-w-full shrink-0">
                      <StatusBadge status={item.status === 'SUBSCRIPTION_OPEN' ? 'Open for subscription' : 'Token instrument created'} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total units</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">{item.totalUnits}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Investor units</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">{item.investorOfferedUnits ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Approved</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">{item.approvedInvestors.length}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {instruments.length > instrumentsPerPage && (
              <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground">
                  Page {instrumentPage} of {instrumentPageCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setInstrumentPage((current) => Math.max(1, current - 1))}
                    disabled={instrumentPage === 1}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setInstrumentPage((current) => Math.min(instrumentPageCount, current + 1))}
                    disabled={instrumentPage === instrumentPageCount}
                  >
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(selectedInstrument)}
        onOpenChange={(open) => {
          if (!open) setSelectedInstrument(null);
        }}
      >
        <DialogContent className="max-w-xl">
          {selectedInstrument && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  {selectedInstrument.instrumentId}
                </DialogTitle>
                <DialogDescription>
                  {instrumentDetailsLoading
                    ? 'Loading the latest instrument details...'
                    : 'Review the essential details before using this tokenized instrument.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Contract</p>
                  <p className="mt-1 font-medium">{selectedInstrument.contractBusinessId || 'Not available'}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Property</p>
                  <p className="mt-1 font-medium">{selectedInstrument.propertyName || 'Managed property'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedInstrument.propertyId || 'Property ID not available'}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                  <div className="mt-1"><StatusBadge status={selectedInstrument.status ?? 'SUBSCRIPTION_OPEN'} /></div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total units</p>
                  <p className="mt-1 font-medium">{selectedInstrument.totalUnits}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Investor units</p>
                  <p className="mt-1 font-medium">{selectedInstrument.investorOfferedUnits ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Owner units</p>
                  <p className="mt-1 font-medium">{selectedInstrument.ownerRetainedUnits ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Nominal value / unit</p>
                  <p className="mt-1 font-medium">{formatCurrency(selectedInstrument.nominalValuePerUnit)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Upfront price / unit</p>
                  <p className="mt-1 font-medium">{formatCurrency(selectedInstrument.investorUpfrontPricePerUnit)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Approved investors</p>
                  <p className="mt-1 font-medium">{selectedInstrument.approvedInvestors.length}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

type InvestorInstrumentRecord = {
  contractId: string;
  instrumentId: string;
  contractBusinessId: string;
  totalUnits: number;
  investorOfferedUnits: number;
  investorUpfrontPricePerUnit: number;
  nominalValuePerUnit: number;
  status: string;
};

type InvestorSubscriptionRecord = {
  contractId: string;
  instrumentId: string;
  requestedUnits: number;
  upfrontAmount: number;
  paymentReference: string;
  status: string;
};

type InvestorHoldingRecord = {
  contractId: string;
  instrumentId: string;
  amount: number;
  upfrontAmount: number;
  status: string;
};

type InvestorFundingRecord = {
  contractId: string;
  instrumentId: string;
  fundedUnits: number;
  upfrontAmount: number;
  confirmedPaymentReference: string;
  status: string;
};

type InvestorRewardRecord = {
  contractId: string;
  instrumentId: string;
  unitsHeld: number;
  rewardAmount: number;
  status: string;
};

type InvestorRewardConfirmationRecord = {
  contractId: string;
  instrumentId: string;
  rewardAmount: number;
  rewardPaymentReference: string;
  status: string;
};

type InvestorSupplyRecord = {
  contractId: string;
  instrumentId: string;
  totalUnits: number;
  investorOfferedUnits: number;
  status: string;
};

function InvestorInvestmentsWorkspace({
  token,
  partyId,
}: {
  token: string;
  partyId: string;
}) {
  const [instruments, setInstruments] = React.useState<InvestorInstrumentRecord[]>([]);
  const [instrumentDetails, setInstrumentDetails] = React.useState<InvestorInstrumentRecord[]>([]);
  const [supplies, setSupplies] = React.useState<InvestorSupplyRecord[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<InvestorSubscriptionRecord[]>([]);
  const [holdings, setHoldings] = React.useState<InvestorHoldingRecord[]>([]);
  const [holderHoldings, setHolderHoldings] = React.useState<InvestorHoldingRecord[]>([]);
  const [instrumentHoldings, setInstrumentHoldings] = React.useState<InvestorHoldingRecord[]>([]);
  const [selectedHolding, setSelectedHolding] = React.useState<InvestorHoldingRecord | null>(null);
  const [fundingConfirmations, setFundingConfirmations] = React.useState<InvestorFundingRecord[]>([]);
  const [rewards, setRewards] = React.useState<InvestorRewardRecord[]>([]);
  const [rewardConfirmations, setRewardConfirmations] = React.useState<InvestorRewardConfirmationRecord[]>([]);
  const [form, setForm] = React.useState({
    instrumentId: '',
    requestedUnits: '100',
    upfrontAmount: '6800',
    paymentReference: 'BANK-PAYMENT-INVESTOR-1',
  });
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        instrumentResponse,
        subscriptionResponse,
        holdingResponse,
        holderHoldingResponse,
        fundingResponse,
        rewardResponse,
        rewardConfirmationResponse,
      ] = await Promise.all([
        getInstruments(token),
        getSubscriptions(token),
        getHoldings(token),
        getHoldingsByHolder(token, partyId),
        getSubscriptionFundingConfirmations(token),
        getPaymentRewards(token),
        getRewardPaymentConfirmations(token),
      ]);

      const normalizedInstruments = instrumentResponse
        .map((event) => {
          const args = getDamlCreateArguments<{
            contractId?: unknown;
            instrumentId?: unknown;
            totalUnits?: unknown;
            investorOfferedUnits?: unknown;
            investorUpfrontPricePerUnit?: unknown;
            nominalValuePerUnit?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            contractBusinessId: toStringValue(args.contractId, ''),
            instrumentId: toStringValue(args.instrumentId, ''),
            totalUnits: toNumber(args.totalUnits),
            investorOfferedUnits: toNumber(args.investorOfferedUnits),
            investorUpfrontPricePerUnit: toNumber(args.investorUpfrontPricePerUnit),
            nominalValuePerUnit: toNumber(args.nominalValuePerUnit),
            status: toStringValue(args.status, 'SUBSCRIPTION_OPEN'),
          };
        })
        .filter((item) => item.instrumentId);

      const normalizedSubscriptions = subscriptionResponse
        .map((event) => {
          const args = getDamlCreateArguments<{
            instrumentId?: unknown;
            requestedUnits?: unknown;
            upfrontAmount?: unknown;
            paymentReference?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            requestedUnits: toNumber(args.requestedUnits),
            upfrontAmount: toNumber(args.upfrontAmount),
            paymentReference: toStringValue(args.paymentReference, ''),
            status: toStringValue(args.status, 'SUBMITTED'),
          };
        })
        .filter((item) => item.instrumentId);

      const normalizedHoldings = holdingResponse
        .map((event) => {
          const args = getDamlCreateArguments<{
            instrumentIdText?: unknown;
            amount?: unknown;
            upfrontAmount?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentIdText, ''),
            amount: toNumber(args.amount),
            upfrontAmount: toNumber(args.upfrontAmount),
            status: toStringValue(args.status, 'ACTIVE'),
          };
        })
        .filter((item) => item.instrumentId);

      const normalizedFunding = fundingResponse
        .map((event) => {
          const args = getDamlCreateArguments<{
            instrumentId?: unknown;
            fundedUnits?: unknown;
            upfrontAmount?: unknown;
            confirmedPaymentReference?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            fundedUnits: toNumber(args.fundedUnits),
            upfrontAmount: toNumber(args.upfrontAmount),
            confirmedPaymentReference: toStringValue(args.confirmedPaymentReference, ''),
            status: toStringValue(args.status, 'FUNDED'),
          };
        })
        .filter((item) => item.instrumentId);

      const normalizedRewards = rewardResponse
        .map((event) => {
          const args = getDamlCreateArguments<{
            instrumentId?: unknown;
            unitsHeld?: unknown;
            rewardAmount?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            unitsHeld: toNumber(args.unitsHeld),
            rewardAmount: toNumber(args.rewardAmount),
            status: toStringValue(args.status, 'PAYMENT_PENDING'),
          };
        })
        .filter((item) => item.instrumentId);

      const normalizedRewardConfirmations = rewardConfirmationResponse
        .map((event) => {
          const args = getDamlCreateArguments<{
            instrumentId?: unknown;
            rewardAmount?: unknown;
            rewardPaymentReference?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            rewardAmount: toNumber(args.rewardAmount),
            rewardPaymentReference: toStringValue(args.rewardPaymentReference, ''),
            status: toStringValue(args.status, 'REWARD_PAID'),
          };
        })
        .filter((item) => item.instrumentId);

      setInstruments(normalizedInstruments as InvestorInstrumentRecord[]);
      setSubscriptions(normalizedSubscriptions as InvestorSubscriptionRecord[]);
      setHoldings(normalizedHoldings as InvestorHoldingRecord[]);
      setHolderHoldings(
        holderHoldingResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              instrumentIdText?: unknown;
              amount?: unknown;
              upfrontAmount?: unknown;
              status?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });
            return {
              contractId: String(event.contractId),
              instrumentId: toStringValue(args.instrumentIdText, ''),
              amount: toNumber(args.amount),
              upfrontAmount: toNumber(args.upfrontAmount),
              status: toStringValue(args.status, 'ACTIVE'),
            };
          })
          .filter((item) => item.instrumentId) as InvestorHoldingRecord[]
      );
      setFundingConfirmations(normalizedFunding as InvestorFundingRecord[]);
      setRewards(normalizedRewards as InvestorRewardRecord[]);
      setRewardConfirmations(normalizedRewardConfirmations as InvestorRewardConfirmationRecord[]);

      const selectedInstrumentId = form.instrumentId || normalizedInstruments[0]?.instrumentId || '';
      if (selectedInstrumentId) {
        const [instrumentDetailResponse, instrumentHoldingResponse] = await Promise.all([
          getInstrumentById(token, selectedInstrumentId),
          getHoldingsByInstrument(token, selectedInstrumentId),
        ]);

        const normalizedInstrumentDetails = instrumentDetailResponse
            .map((event) => {
              const args = getDamlCreateArguments<{
                contractId?: unknown;
                instrumentId?: unknown;
                totalUnits?: unknown;
                investorOfferedUnits?: unknown;
                investorUpfrontPricePerUnit?: unknown;
                nominalValuePerUnit?: unknown;
                status?: unknown;
              }>({ contractId: String(event.contractId), createArguments: event.createArguments });
              return {
                contractId: String(event.contractId),
                contractBusinessId: toStringValue(args.contractId, ''),
                instrumentId: toStringValue(args.instrumentId, ''),
                totalUnits: toNumber(args.totalUnits),
                investorOfferedUnits: toNumber(args.investorOfferedUnits),
                investorUpfrontPricePerUnit: toNumber(args.investorUpfrontPricePerUnit),
                nominalValuePerUnit: toNumber(args.nominalValuePerUnit),
                status: toStringValue(args.status, 'SUBSCRIPTION_OPEN'),
              };
            })
            .filter((item) => item.instrumentId) as InvestorInstrumentRecord[];

        setInstrumentDetails(normalizedInstrumentDetails);
        setSupplies(
          normalizedInstrumentDetails.map((item) => ({
            contractId: item.contractId,
            instrumentId: item.instrumentId,
            totalUnits: item.totalUnits,
            investorOfferedUnits: item.investorOfferedUnits,
            status: item.status,
          }))
        );

        setInstrumentHoldings(
          instrumentHoldingResponse
            .map((event) => {
              const args = getDamlCreateArguments<{
                instrumentIdText?: unknown;
                amount?: unknown;
                upfrontAmount?: unknown;
                status?: unknown;
              }>({ contractId: String(event.contractId), createArguments: event.createArguments });
              return {
                contractId: String(event.contractId),
                instrumentId: toStringValue(args.instrumentIdText, ''),
                amount: toNumber(args.amount),
                upfrontAmount: toNumber(args.upfrontAmount),
                status: toStringValue(args.status, 'ACTIVE'),
              };
            })
            .filter((item) => item.instrumentId) as InvestorHoldingRecord[]
        );
      }

      const firstHolding = normalizedHoldings[0];
      if (firstHolding) {
        const holdingDetail = await getHoldingByCid(token, firstHolding.contractId).catch(() => []);
        const event = holdingDetail[0];
        if (event) {
          const args = getDamlCreateArguments<{
            instrumentIdText?: unknown;
            amount?: unknown;
            upfrontAmount?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          setSelectedHolding({
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentIdText, ''),
            amount: toNumber(args.amount),
            upfrontAmount: toNumber(args.upfrontAmount),
            status: toStringValue(args.status, 'ACTIVE'),
          });
        }
      } else {
        setSelectedHolding(null);
      }

      if (!form.instrumentId && normalizedInstruments[0]) {
        const first = normalizedInstruments[0];
        setForm((current) => ({
          ...current,
          instrumentId: first.instrumentId,
          upfrontAmount: String(toNumber(current.requestedUnits) * first.investorUpfrontPricePerUnit),
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [form.instrumentId, partyId, token]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedInstrument = instruments.find((item) => item.instrumentId === form.instrumentId);
  const totalInvested = subscriptions.reduce((sum, item) => sum + item.upfrontAmount, 0);
  const activeUnits = holdings.reduce((sum, item) => sum + item.amount, 0);
  const pendingRewards = rewards.reduce((sum, item) => sum + item.rewardAmount, 0);
  const paidRewards = rewardConfirmations.reduce((sum, item) => sum + item.rewardAmount, 0);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast.success('Investor workspace refreshed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.instrumentId) {
      toast.error('Select an instrument');
      return;
    }

    setSaving(true);
    try {
      await createSubscription(token, {
        instrumentId: form.instrumentId,
        requestedUnits: toNumber(form.requestedUnits),
        upfrontAmount: toNumber(form.upfrontAmount),
        paymentReference: form.paymentReference.trim(),
      });
      toast.success('Subscription submitted');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleUnitsChange = (value: string) => {
    setForm((current) => ({
      ...current,
      requestedUnits: value,
      upfrontAmount: selectedInstrument
        ? String(toNumber(value) * selectedInstrument.investorUpfrontPricePerUnit)
        : current.upfrontAmount,
    }));
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
        title="Investor workspace"
        description="Subscribe to approved instruments, track holdings, funding confirmations, and rewards from the ledger."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available instruments</CardTitle>
          </CardHeader>
          <CardContent><span className="text-2xl font-semibold">{instruments.length}</span></CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invested</CardTitle>
          </CardHeader>
          <CardContent><span className="text-2xl font-semibold">{formatCurrency(totalInvested)}</span></CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active units</CardTitle>
          </CardHeader>
          <CardContent><span className="text-2xl font-semibold">{activeUnits}</span></CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rewards</CardTitle>
          </CardHeader>
          <CardContent><span className="text-2xl font-semibold">{formatCurrency(pendingRewards + paidRewards)}</span></CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70">
          <CardHeader className="space-y-2 border-b border-border/60">
            <CardTitle className="text-lg">Create subscription</CardTitle>
            <CardDescription>Choose an instrument visible to your investor party.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubscribe}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Instrument</Label>
                <Select
                  value={form.instrumentId}
                  onValueChange={(value) => {
                    const instrument = instruments.find((item) => item.instrumentId === value);
                    setForm((current) => ({
                      ...current,
                      instrumentId: value,
                      upfrontAmount: instrument
                        ? String(toNumber(current.requestedUnits) * instrument.investorUpfrontPricePerUnit)
                        : current.upfrontAmount,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    {instruments.map((item) => (
                      <SelectItem key={item.contractId} value={item.instrumentId}>
                        {item.instrumentId} - {item.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="requestedUnits">Requested units</Label>
                  <Input id="requestedUnits" type="number" min="1" value={form.requestedUnits} onChange={(e) => handleUnitsChange(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upfrontAmount">Upfront amount</Label>
                  <Input id="upfrontAmount" type="number" min="0" step="0.01" value={form.upfrontAmount} onChange={(e) => setForm((current) => ({ ...current, upfrontAmount: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentReference">Payment reference</Label>
                <Input id="paymentReference" value={form.paymentReference} onChange={(e) => setForm((current) => ({ ...current, paymentReference: e.target.value }))} />
              </div>
              {selectedInstrument && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Price per unit</span>
                    <span className="font-medium">{formatCurrency(selectedInstrument.investorUpfrontPricePerUnit)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Investor supply</span>
                    <span className="font-medium">{selectedInstrument.investorOfferedUnits} units</span>
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full gap-2" disabled={saving || instruments.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Submit subscription
              </Button>
            </CardContent>
          </form>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Available instruments</CardTitle>
            <CardDescription>Instruments where your investor party is an observer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {instruments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                No instrument is visible yet. Easycoin must approve your party and create an instrument with it.
              </div>
            ) : (
              instruments.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.instrumentId}</p>
                      <p className="text-sm text-muted-foreground">{item.contractBusinessId}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Offered</p>
                      <p className="mt-1 text-sm font-medium">{item.investorOfferedUnits}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Upfront</p>
                      <p className="mt-1 text-sm font-medium">{formatCurrency(item.investorUpfrontPricePerUnit)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Nominal</p>
                      <p className="mt-1 text-sm font-medium">{formatCurrency(item.nominalValuePerUnit)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Subscriptions</CardTitle>
            <CardDescription>Submitted funding requests awaiting payment verification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">No subscription yet.</div>
            ) : (
              subscriptions.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.instrumentId}</p>
                      <p className="text-sm text-muted-foreground">{item.paymentReference}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {item.requestedUnits} units - {formatCurrency(item.upfrontAmount)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Holdings and funding</CardTitle>
            <CardDescription>Confirmed subscriptions become active holdings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...holdings, ...fundingConfirmations].length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">No funded holding yet.</div>
            ) : (
              <>
                {holdings.map((item) => (
                  <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.instrumentId}</p>
                        <p className="text-sm text-muted-foreground">{item.amount} active units</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
                {fundingConfirmations.map((item) => (
                  <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.instrumentId}</p>
                        <p className="text-sm text-muted-foreground">{item.confirmedPaymentReference}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Instrument detail</CardTitle>
            <CardDescription>Read through `/instruments/:instrumentId`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {instrumentDetails.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No selected instrument detail.</div>
            ) : (
              instrumentDetails.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <p className="font-medium">{item.instrumentId}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.contractBusinessId}</p>
                  <p className="mt-3 text-sm">{item.totalUnits} total units</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Token supply</CardTitle>
            <CardDescription>Visible investor supply from the tokenized instrument.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplies.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No supply visible.</div>
            ) : (
              supplies.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.instrumentId}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{item.investorOfferedUnits} investor units offered from {item.totalUnits} total units</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Holding lookups</CardTitle>
            <CardDescription>Holder, instrument, and CID reads.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">By holder</p>
              <p className="mt-1 text-lg font-semibold">{holderHoldings.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">By selected instrument</p>
              <p className="mt-1 text-lg font-semibold">{instrumentHoldings.length}</p>
            </div>
            {selectedHolding && (
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-sm font-medium">{selectedHolding.instrumentId}</p>
                <p className="mt-1 text-sm text-muted-foreground">CID lookup: {selectedHolding.amount} units</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border/70">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Rewards</CardTitle>
          <CardDescription>Pending rewards and confirmed reward payments visible to your party.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {[...rewards, ...rewardConfirmations].length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground lg:col-span-2">No reward record yet.</div>
          ) : (
            <>
              {rewards.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.instrumentId}</p>
                      <p className="text-sm text-muted-foreground">{item.unitsHeld} units held</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-success">{formatCurrency(item.rewardAmount)}</p>
                </div>
              ))}
              {rewardConfirmations.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.instrumentId}</p>
                      <p className="text-sm text-muted-foreground">{item.rewardPaymentReference}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-success">{formatCurrency(item.rewardAmount)}</p>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

type AuditorLedgerItem = {
  contractId: string;
  instrumentId: string;
  label: string;
  amount?: number;
  status: string;
};

function AuditorInvestmentsWorkspace({
  token,
  roleLabel = 'Auditor',
  includeApprovedInvestors = false,
}: {
  token: string;
  roleLabel?: 'Owner' | 'Auditor' | 'Legal admin';
  includeApprovedInvestors?: boolean;
}) {
  const [instruments, setInstruments] = React.useState<InvestorInstrumentRecord[]>([]);
  const [instrumentDetails, setInstrumentDetails] = React.useState<InvestorInstrumentRecord[]>([]);
  const [supplies, setSupplies] = React.useState<InvestorSupplyRecord[]>([]);
  const [approvedInvestors, setApprovedInvestors] = React.useState<ApprovedInvestorRecord[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<AuditorLedgerItem[]>([]);
  const [fundingConfirmations, setFundingConfirmations] = React.useState<AuditorLedgerItem[]>([]);
  const [holdings, setHoldings] = React.useState<AuditorLedgerItem[]>([]);
  const [holderHoldings, setHolderHoldings] = React.useState<AuditorLedgerItem[]>([]);
  const [instrumentHoldings, setInstrumentHoldings] = React.useState<AuditorLedgerItem[]>([]);
  const [holdingByCid, setHoldingByCid] = React.useState<AuditorLedgerItem | null>(null);
  const [rewards, setRewards] = React.useState<AuditorLedgerItem[]>([]);
  const [rewardConfirmations, setRewardConfirmations] = React.useState<AuditorLedgerItem[]>([]);
  const [selectedInstrumentId, setSelectedInstrumentId] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        instrumentResponse,
        subscriptionResponse,
        fundingResponse,
        holdingResponse,
        rewardResponse,
        rewardConfirmationResponse,
        approvedInvestorResponse,
      ] = await Promise.all([
        getInstruments(token),
        getSubscriptions(token),
        getSubscriptionFundingConfirmations(token),
        getHoldings(token),
        getPaymentRewards(token),
        getRewardPaymentConfirmations(token),
        includeApprovedInvestors ? getApprovedInvestors(token) : Promise.resolve([]),
      ]);

      const normalizedInstruments = instrumentResponse
        .map((event) => {
          const args = getDamlCreateArguments<{
            contractId?: unknown;
            instrumentId?: unknown;
            totalUnits?: unknown;
            investorOfferedUnits?: unknown;
            investorUpfrontPricePerUnit?: unknown;
            nominalValuePerUnit?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            contractBusinessId: toStringValue(args.contractId, ''),
            instrumentId: toStringValue(args.instrumentId, ''),
            totalUnits: toNumber(args.totalUnits),
            investorOfferedUnits: toNumber(args.investorOfferedUnits),
            investorUpfrontPricePerUnit: toNumber(args.investorUpfrontPricePerUnit),
            nominalValuePerUnit: toNumber(args.nominalValuePerUnit),
            status: toStringValue(args.status, ''),
          };
        })
        .filter((item) => item.instrumentId);

      const effectiveInstrumentId = selectedInstrumentId || normalizedInstruments[0]?.instrumentId || '';
      const [instrumentDetailResponse, supplyResponse, instrumentHoldingResponse] = effectiveInstrumentId
        ? await Promise.all([
            getInstrumentById(token, effectiveInstrumentId).catch(() => []),
            getInstrumentSupply(token, effectiveInstrumentId).catch(() => []),
            getHoldingsByInstrument(token, effectiveInstrumentId).catch(() => []),
          ])
        : [[], [], []];

      setInstruments(normalizedInstruments as InvestorInstrumentRecord[]);
      setSelectedInstrumentId(effectiveInstrumentId);
      setInstrumentDetails(
        instrumentDetailResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              contractId?: unknown;
              instrumentId?: unknown;
              totalUnits?: unknown;
              investorOfferedUnits?: unknown;
              investorUpfrontPricePerUnit?: unknown;
              nominalValuePerUnit?: unknown;
              status?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });
            return {
              contractId: String(event.contractId),
              contractBusinessId: toStringValue(args.contractId, ''),
              instrumentId: toStringValue(args.instrumentId, ''),
              totalUnits: toNumber(args.totalUnits),
              investorOfferedUnits: toNumber(args.investorOfferedUnits),
              investorUpfrontPricePerUnit: toNumber(args.investorUpfrontPricePerUnit),
              nominalValuePerUnit: toNumber(args.nominalValuePerUnit),
              status: toStringValue(args.status, ''),
            };
          })
          .filter((item) => item.instrumentId) as InvestorInstrumentRecord[]
      );
      setSupplies(
        supplyResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              instrumentId?: unknown;
              totalUnits?: unknown;
              investorOfferedUnits?: unknown;
              investorIssuedUnits?: unknown;
              status?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });
            return {
              contractId: String(event.contractId),
              instrumentId: toStringValue(args.instrumentId, ''),
              totalUnits: toNumber(args.totalUnits),
              investorOfferedUnits: toNumber(args.investorOfferedUnits ?? args.investorIssuedUnits),
              status: toStringValue(args.status, ''),
            };
          })
          .filter((item) => item.instrumentId) as InvestorSupplyRecord[]
      );

      const mapSubscription = (event: { contractId: string; createArguments?: Record<string, unknown> }) => {
        const args = getDamlCreateArguments<{
          instrumentId?: unknown;
          investor?: unknown;
          requestedUnits?: unknown;
          upfrontAmount?: unknown;
          status?: unknown;
        }>({ contractId: String(event.contractId), createArguments: event.createArguments });
        return {
          contractId: String(event.contractId),
          instrumentId: toStringValue(args.instrumentId, ''),
          label: toStringValue(args.investor, 'Investor subscription'),
          amount: toNumber(args.upfrontAmount || args.requestedUnits),
          status: toStringValue(args.status, ''),
        };
      };

      const mapHolding = (event: { contractId: string; createArguments?: Record<string, unknown> }) => {
        const args = getDamlCreateArguments<{
          instrumentIdText?: unknown;
          holder?: unknown;
          amount?: unknown;
          status?: unknown;
        }>({ contractId: String(event.contractId), createArguments: event.createArguments });
        return {
          contractId: String(event.contractId),
          instrumentId: toStringValue(args.instrumentIdText, ''),
          label: toStringValue(args.holder, 'Holder'),
          amount: toNumber(args.amount),
          status: toStringValue(args.status, ''),
        };
      };

      const mapReward = (event: { contractId: string; createArguments?: Record<string, unknown> }) => {
        const args = getDamlCreateArguments<{
          instrumentId?: unknown;
          recipient?: unknown;
          rewardAmount?: unknown;
          status?: unknown;
        }>({ contractId: String(event.contractId), createArguments: event.createArguments });
        return {
          contractId: String(event.contractId),
          instrumentId: toStringValue(args.instrumentId, ''),
          label: toStringValue(args.recipient, 'Reward recipient'),
          amount: toNumber(args.rewardAmount),
          status: toStringValue(args.status, ''),
        };
      };

      const normalizedHoldings = holdingResponse.map(mapHolding).filter((item) => item.instrumentId);
      const normalizedApprovedInvestors = approvedInvestorResponse
        .map((event) => {
          const args = getDamlCreateArguments<{
            investor?: unknown;
            approvalReference?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            investor: toStringValue(args.investor, ''),
            approvalReference: toStringValue(args.approvalReference, ''),
          };
        })
        .filter((item) => item.investor);
      const firstHolding = normalizedHoldings[0];
      const [holderHoldingResponse, holdingByCidResponse] = firstHolding
        ? await Promise.all([
            getHoldingsByHolder(token, firstHolding.label).catch(() => []),
            getHoldingByCid(token, firstHolding.contractId).catch(() => []),
          ])
        : [[], []];

      setSubscriptions(subscriptionResponse.map(mapSubscription).filter((item) => item.instrumentId));
      setApprovedInvestors(normalizedApprovedInvestors as ApprovedInvestorRecord[]);
      setFundingConfirmations(fundingResponse.map(mapSubscription).filter((item) => item.instrumentId));
      setHoldings(normalizedHoldings);
      setHolderHoldings(holderHoldingResponse.map(mapHolding).filter((item) => item.instrumentId));
      setInstrumentHoldings(instrumentHoldingResponse.map(mapHolding).filter((item) => item.instrumentId));
      const holdingDetail = holdingByCidResponse.map(mapHolding).filter((item) => item.instrumentId)[0];
      setHoldingByCid(holdingDetail ?? null);
      setRewards(rewardResponse.map(mapReward).filter((item) => item.instrumentId));
      setRewardConfirmations(rewardConfirmationResponse.map(mapReward).filter((item) => item.instrumentId));
    } finally {
      setLoading(false);
    }
  }, [includeApprovedInvestors, selectedInstrumentId, token]);

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

  const renderItems = (items: AuditorLedgerItem[], empty: string) =>
    items.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">{empty}</div>
    ) : (
      items.map((item) => (
        <div key={`${item.contractId}-${item.status}`} className="rounded-xl border border-border/60 bg-background/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{item.instrumentId}</p>
              <p className="truncate text-sm text-muted-foreground">{item.label}</p>
            </div>
            <StatusBadge status={item.status || 'Visible'} />
          </div>
          {item.amount !== undefined && <p className="mt-3 text-sm font-medium">{item.amount}</p>}
        </div>
      ))
    );

  const uniqueInstrumentOptions = Array.from(
    new Map(instruments.map((item) => [item.instrumentId, item])).values(),
  );

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
        title={`${roleLabel} investment ledger`}
        description="Review tokenized instruments, subscriptions, holdings, funding confirmations, and payment records."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Instruments</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{instruments.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{subscriptions.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Holdings</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{holdings.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{includeApprovedInvestors ? 'Approved investors' : 'Rewards'}</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{includeApprovedInvestors ? approvedInvestors.length : rewards.length + rewardConfirmations.length}</span></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {includeApprovedInvestors && (
          <Card className="border-border/70 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Approved investors</CardTitle>
              <CardDescription>Investors approved for participation and visible to legal compliance.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {approvedInvestors.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground md:col-span-2">No approved investor visible.</div>
              ) : (
                approvedInvestors.map((item) => (
                  <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                    <p className="truncate font-medium">{item.investor}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{item.approvalReference}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tokenized instruments</CardTitle>
            <CardDescription>Visible instruments and selected supply state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedInstrumentId} onValueChange={setSelectedInstrumentId}>
              <SelectTrigger className="min-w-0">
                <SelectValue placeholder="Select instrument" />
              </SelectTrigger>
              <SelectContent>
                {uniqueInstrumentOptions.map((item) => (
                  <SelectItem key={item.contractId} value={item.instrumentId}>{item.instrumentId}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {instruments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No instrument visible.</div>
            ) : (
              instruments.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.instrumentId}</p>
                      <p className="text-sm text-muted-foreground">{item.contractBusinessId}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{item.investorOfferedUnits} investor units from {item.totalUnits} total</p>
                </div>
              ))
            )}
            {supplies.map((item) => (
              <div key={item.contractId} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-sm font-medium">Supply: {item.instrumentId}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.investorOfferedUnits} issued/offered from {item.totalUnits}</p>
              </div>
            ))}
            {instrumentDetails.map((item) => (
              <div key={`detail-${item.contractId}`} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-sm font-medium">Instrument detail: {item.instrumentId}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.contractBusinessId} - {formatCurrency(item.nominalValuePerUnit)} nominal value</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Subscriptions and funding</CardTitle>
            <CardDescription>Investor subscriptions and confirmed funding records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {renderItems([...subscriptions, ...fundingConfirmations], 'No subscription or funding confirmation visible.')}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Holdings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {renderItems(holdings, 'No holding visible.')}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">By holder</p>
                <p className="mt-2 text-lg font-semibold">{holderHoldings.length}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">By instrument</p>
                <p className="mt-2 text-lg font-semibold">{instrumentHoldings.length}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">By CID</p>
                <p className="mt-2 text-lg font-semibold">{holdingByCid ? 1 : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Rewards and payment confirmations</CardTitle></CardHeader>
          <CardContent className="space-y-3">{renderItems([...rewards, ...rewardConfirmations], 'No reward record visible.')}</CardContent>
        </Card>
      </div>
    </>
  );
}

type PaymentVerifierSubscriptionRecord = {
  contractId: string;
  investor: string;
  instrumentId: string;
  requestedUnits: number;
  upfrontAmount: number;
  paymentReference: string;
  status: string;
};

function PaymentVerifierInvestmentsWorkspace({ token }: { token: string }) {
  const [subscriptions, setSubscriptions] = React.useState<PaymentVerifierSubscriptionRecord[]>([]);
  const [fundingConfirmations, setFundingConfirmations] = React.useState<AuditorLedgerItem[]>([]);
  const [fundingRefs, setFundingRefs] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [subscriptionResponse, fundingResponse] =
        await Promise.all([
          getSubscriptions(token),
          getSubscriptionFundingConfirmations(token),
        ]);

      const normalizedSubscriptions = subscriptionResponse
        .map((event) => {
          const args = getDamlCreateArguments<{
            investor?: unknown;
            instrumentId?: unknown;
            requestedUnits?: unknown;
            upfrontAmount?: unknown;
            paymentReference?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            investor: toStringValue(args.investor, ''),
            instrumentId: toStringValue(args.instrumentId, ''),
            requestedUnits: toNumber(args.requestedUnits),
            upfrontAmount: toNumber(args.upfrontAmount),
            paymentReference: toStringValue(args.paymentReference, ''),
            status: toStringValue(args.status, 'SUBMITTED'),
          };
        })
        .filter((item) => item.instrumentId);

      const mapFunding = (event: { contractId: string; createArguments?: Record<string, unknown> }) => {
        const args = getDamlCreateArguments<{
          investor?: unknown;
          instrumentId?: unknown;
          upfrontAmount?: unknown;
          confirmedPaymentReference?: unknown;
          status?: unknown;
        }>({ contractId: String(event.contractId), createArguments: event.createArguments });
        return {
          contractId: String(event.contractId),
          instrumentId: toStringValue(args.instrumentId, ''),
          label: toStringValue(args.confirmedPaymentReference || args.investor, ''),
          amount: toNumber(args.upfrontAmount),
          status: toStringValue(args.status, 'FUNDED'),
        };
      };

      setSubscriptions(normalizedSubscriptions as PaymentVerifierSubscriptionRecord[]);
      setFundingConfirmations(fundingResponse.map(mapFunding).filter((item) => item.instrumentId));
      setFundingRefs((current) => {
        const next = { ...current };
        normalizedSubscriptions.forEach((item) => {
          next[item.contractId] ??= `BANK-CONFIRMED-${item.paymentReference || item.instrumentId}`;
        });
        return next;
      });
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

  const handleConfirmFunding = async (subscriptionCid: string) => {
    const confirmedPaymentReference = fundingRefs[subscriptionCid]?.trim();
    if (!confirmedPaymentReference) {
      toast.error('Enter a confirmed payment reference');
      return;
    }

    setPendingAction(subscriptionCid);
    try {
      await confirmFunding(token, subscriptionCid, { confirmedPaymentReference });
      toast.success('Funding confirmed');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to confirm funding');
    } finally {
      setPendingAction(null);
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
        title="Funding confirmation"
        description="Confirm that investor upfront payment was received. The backend creates the FundingConfirmation, investor holding, and updates TokenSupply."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending subscriptions</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{subscriptions.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Confirmed funding</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{fundingConfirmations.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Requested units</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{subscriptions.reduce((sum, item) => sum + item.requestedUnits, 0)}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Upfront amount</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{formatCurrency(subscriptions.reduce((sum, item) => sum + item.upfrontAmount, 0))}</span></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pending subscriptions</CardTitle>
            <CardDescription>Uses `GET /subscriptions` and confirms with `POST /subscriptions/:subscriptionCid/confirm-funding`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">No subscription pending verification.</div>
            ) : (
              subscriptions.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{item.instrumentId}</p>
                      <p className="truncate text-sm text-muted-foreground">{item.investor}</p>
                      <p className="mt-2 text-sm">{item.requestedUnits} units - {formatCurrency(item.upfrontAmount)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Payment reference: {item.paymentReference}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={fundingRefs[item.contractId] ?? ''}
                      onChange={(e) => setFundingRefs((current) => ({ ...current, [item.contractId]: e.target.value }))}
                      placeholder="BANK-CONFIRMED-PAYMENT-INVESTOR-1"
                    />
                    <Button className="gap-2" onClick={() => handleConfirmFunding(item.contractId)} disabled={pendingAction === item.contractId}>
                      {pendingAction === item.contractId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Confirm
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Funding confirmations</CardTitle>
            <CardDescription>Uses `GET /subscriptions/funding-confirmations` after successful confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {fundingConfirmations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">No funding confirmation yet.</div>
            ) : (
              fundingConfirmations.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.instrumentId}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
                  {item.amount !== undefined && item.amount > 0 && <p className="mt-2 text-sm">{formatCurrency(item.amount)}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border/70">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Success result</CardTitle>
          <CardDescription>
            On success the backend creates a FundingConfirmation and investor holding. `supplyCid` is optional because the backend can find TokenSupply automatically.
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}

const adminReaderParties = [
  { label: 'Easycoin', value: localDamlParties.easycoin },
  { label: 'Owner', value: localDamlParties.owner },
  { label: 'Investor 1', value: localDamlParties.investor1 },
  { label: 'Investor 2', value: localDamlParties.investor2 },
  { label: 'Investor 3', value: localDamlParties.investor3 },
  { label: 'Investor 4', value: localDamlParties.investor4 },
  { label: 'Auditor', value: localDamlParties.auditor },
  { label: 'Payment verifier', value: localDamlParties.paymentVerifier },
  { label: 'Legal admin', value: localDamlParties.legalAdmin },
];

function AdminInvestmentsWorkspace({ token }: { token: string }) {
  const [readerParty, setReaderParty] = React.useState<string>(localDamlParties.easycoin);
  const [subscriptions, setSubscriptions] = React.useState<AuditorLedgerItem[]>([]);
  const [fundingConfirmations, setFundingConfirmations] = React.useState<AuditorLedgerItem[]>([]);
  const [holdings, setHoldings] = React.useState<AuditorLedgerItem[]>([]);
  const [holderHoldings, setHolderHoldings] = React.useState<AuditorLedgerItem[]>([]);
  const [paymentRewards, setPaymentRewards] = React.useState<AuditorLedgerItem[]>([]);
  const [rewardConfirmations, setRewardConfirmations] = React.useState<AuditorLedgerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const mapLedgerItem = React.useCallback((event: { contractId: string; createArguments?: Record<string, unknown> }) => {
    const args = getDamlCreateArguments<{
      instrumentId?: unknown;
      instrumentIdText?: unknown;
      investor?: unknown;
      holder?: unknown;
      recipient?: unknown;
      upfrontAmount?: unknown;
      requestedUnits?: unknown;
      amount?: unknown;
      rewardAmount?: unknown;
      paymentReference?: unknown;
      confirmedPaymentReference?: unknown;
      rewardPaymentReference?: unknown;
      status?: unknown;
    }>({ contractId: String(event.contractId), createArguments: event.createArguments });

    return {
      contractId: String(event.contractId),
      instrumentId: toStringValue(args.instrumentId ?? args.instrumentIdText, ''),
      label: toStringValue(
        args.confirmedPaymentReference ??
          args.rewardPaymentReference ??
          args.paymentReference ??
          args.holder ??
          args.investor ??
          args.recipient,
        'Ledger record',
      ),
      amount: toNumber(args.upfrontAmount ?? args.requestedUnits ?? args.amount ?? args.rewardAmount),
      status: toStringValue(args.status, 'Visible'),
    };
  }, []);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [subscriptionResponse, fundingResponse, holdingResponse, rewardResponse, rewardConfirmationResponse] =
        await Promise.all([
          getSubscriptions(token, readerParty),
          getSubscriptionFundingConfirmations(token, readerParty),
          getHoldings(token, readerParty),
          getPaymentRewards(token, readerParty),
          getRewardPaymentConfirmations(token, readerParty),
        ]);

      const normalizedHoldings = holdingResponse.map(mapLedgerItem).filter((item) => item.instrumentId);
      const firstHolding = normalizedHoldings[0];
      const byHolder = firstHolding
        ? await getHoldingsByHolder(token, firstHolding.label, readerParty).catch(() => [])
        : [];

      setSubscriptions(subscriptionResponse.map(mapLedgerItem).filter((item) => item.instrumentId));
      setFundingConfirmations(fundingResponse.map(mapLedgerItem).filter((item) => item.instrumentId));
      setHoldings(normalizedHoldings);
      setHolderHoldings(byHolder.map(mapLedgerItem).filter((item) => item.instrumentId));
      setPaymentRewards(rewardResponse.map(mapLedgerItem).filter((item) => item.instrumentId));
      setRewardConfirmations(rewardConfirmationResponse.map(mapLedgerItem).filter((item) => item.instrumentId));
    } finally {
      setLoading(false);
    }
  }, [mapLedgerItem, readerParty, token]);

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

  const renderItems = (items: AuditorLedgerItem[], empty: string) =>
    items.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">{empty}</div>
    ) : (
      items.map((item) => (
        <div key={`${item.contractId}-${item.status}`} className="rounded-xl border border-border/60 bg-background/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{item.instrumentId}</p>
              <p className="truncate text-sm text-muted-foreground">{item.label}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
          {item.amount !== undefined && item.amount > 0 && <p className="mt-3 text-sm font-medium">{item.amount}</p>}
        </div>
      ))
    );

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
        title="Admin ledger access"
        description="Read Admin-authorized subscriptions, funding confirmations, holdings, and payment records by selected Daml party."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Reader party</CardTitle>
          <CardDescription>Admin uses backend `?party=`/`?reader=` support to inspect another ledger view.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={readerParty} onValueChange={setReaderParty}>
            <SelectTrigger className="max-w-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {adminReaderParties.map((party) => (
                <SelectItem key={party.value} value={party.value}>{party.label} - {party.value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{subscriptions.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Funded</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{fundingConfirmations.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Holdings</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{holdings.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Payments</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{paymentRewards.length + rewardConfirmations.length}</span></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Subscriptions and funding</CardTitle></CardHeader>
          <CardContent className="space-y-3">{renderItems([...subscriptions, ...fundingConfirmations], 'No subscription or funding record visible for this party.')}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Holdings</CardTitle><CardDescription>Includes holder lookup for the first visible holding.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {renderItems(holdings, 'No holding visible for this party.')}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">By holder lookup</p>
              <p className="mt-2 text-lg font-semibold">{holderHoldings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 lg:col-span-2">
          <CardHeader><CardTitle className="text-base font-semibold">Reward and payment records</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">{renderItems([...paymentRewards, ...rewardConfirmations], 'No payment record visible for this party.')}</CardContent>
        </Card>
      </div>
    </>
  );
}

export default function InvestmentsPage() {
  const { session } = useSession();
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  if (session.role === 'EASYCOIN') {
    return <EasycoinInvestmentsWorkspace token={session.accessToken} />;
  }

  if (session.role === 'OWNER') {
    return <AuditorInvestmentsWorkspace token={session.accessToken} roleLabel="Owner" />;
  }

  if (session.role === 'INVESTOR') {
    return <InvestorInvestmentsWorkspace token={session.accessToken} partyId={session.partyId} />;
  }

  if (session.role === 'AUDITOR') {
    return <AuditorInvestmentsWorkspace token={session.accessToken} />;
  }

  if (session.role === 'LEGAL_ADMIN') {
    return (
      <AuditorInvestmentsWorkspace
        token={session.accessToken}
        roleLabel="Legal admin"
        includeApprovedInvestors
      />
    );
  }

  if (session.role === 'PAYMENT_VERIFIER') {
    return <PaymentVerifierInvestmentsWorkspace token={session.accessToken} />;
  }

  if (session.role === 'ADMIN') {
    return <AdminInvestmentsWorkspace token={session.accessToken} />;
  }

  const filtered = React.useMemo(() => {
    return investments.filter((item) => {
      const haystack = `${item.holder} ${item.contractId} ${item.instrumentId}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (filters.Status && item.status !== filters.Status) return false;
      if (filters.Role && item.role !== filters.Role) return false;
      return true;
    });
  }, [search, filters]);

  const totalUpfront = investments.reduce((sum, item) => sum + item.upfrontPaid, 0);
  const totalReward = investments.reduce((sum, item) => sum + item.expectedReward, 0);
  const totalUnits = investments.reduce((sum, item) => sum + item.units, 0);

  const columns: Column<Investment>[] = [
    {
      key: 'holder',
      header: 'Holder',
      sortable: true,
      sortValue: (row) => row.holder,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.holder}</span>
          <span className="text-xs text-muted-foreground">
            {row.contractId} - {row.instrumentId}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      sortValue: (row) => row.role,
      cell: (row) => <StatusBadge status={row.role} />,
    },
    {
      key: 'units',
      header: 'Units',
      sortable: true,
      sortValue: (row) => row.units,
      align: 'right',
      cell: (row) => <span className="font-semibold tabular-nums">{row.units}</span>,
    },
    {
      key: 'upfrontPaid',
      header: 'Upfront paid',
      sortable: true,
      sortValue: (row) => row.upfrontPaid,
      align: 'right',
      cell: (row) => (
        <span className="font-semibold tabular-nums">{formatCurrency(row.upfrontPaid)}</span>
      ),
    },
    {
      key: 'expectedReward',
      header: 'Expected reward',
      sortable: true,
      sortValue: (row) => row.expectedReward,
      align: 'right',
      cell: (row) => (
        <span className="font-semibold tabular-nums text-success">
          {formatCurrency(row.expectedReward)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Lifecycle',
      sortable: true,
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'startDate',
      header: 'Subscribed',
      sortable: true,
      sortValue: (row) => row.startDate,
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.startDate)}</span>,
    },
    {
      key: 'snapshot',
      header: 'Snapshot',
      cell: (row) => <span className="text-muted-foreground">{row.snapshot}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Investor participation"
        description="Approved investors, funding confirmation, token holdings, and reward exposure."
      >
        <Button size="sm" className="gap-2">
          <Coins className="h-4 w-4" />
          Create subscription
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total upfront funding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">
              {formatCurrency(totalUpfront)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expected reward pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">
              {formatCurrency(totalReward)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Token units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{totalUnits}</span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Search holder, contract, or instrument"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
        </div>

        <FilterBar
          filters={[
            { label: 'Status', options: statusOptions },
            { label: 'Role', options: [{ label: 'Owner', value: 'Owner' }, { label: 'Investor', value: 'Investor' }] },
          ]}
          activeFilters={filters}
          onFilterChange={(key, value) =>
            setFilters((prev) => ({ ...prev, [key]: value }))
          }
          onClearAll={() => setFilters({})}
        />

        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
          pageSize={10}
          emptyState={
            <EmptyState
              icon={Users}
              title="No participation records found"
              description="Try adjusting your search or filters."
            />
          }
        />
      </div>
    </>
  );
}
