'use client';

import * as React from 'react';
import { Coins, Loader2, PlusCircle, RefreshCw, ShieldCheck, Users } from 'lucide-react';

import { investments, type Investment } from '@/lib/mock-investments';
import { formatCurrency, formatDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import {
  approveInvestor,
  createSubscription,
  createInstrument,
  getApprovedInvestors,
  getDamlCreateArguments,
  getHoldingByCid,
  getHoldings,
  getHoldingsByHolder,
  getHoldingsByInstrument,
  getInstrumentById,
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

type InstrumentRecord = {
  contractId: string;
  instrumentId: string;
  totalUnits: number;
  nominalValuePerUnit: number;
  investorUpfrontPricePerUnit: number;
  approvedInvestors: string[];
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

function EasycoinInvestmentsWorkspace({ token }: { token: string }) {
  const [approvedInvestors, setApprovedInvestors] = React.useState<ApprovedInvestorRecord[]>([]);
  const [validatedContracts, setValidatedContracts] = React.useState<ValidatedContractRecord[]>([]);
  const [instruments, setInstruments] = React.useState<InstrumentRecord[]>([]);
  const [selectedContractId, setSelectedContractId] = React.useState('');
  const [selectedApprovedInvestors, setSelectedApprovedInvestors] = React.useState<string[]>([]);
  const [approvalInvestor, setApprovalInvestor] = React.useState(sampleInvestors[0].partyId);
  const [approvalReference, setApprovalReference] = React.useState('KYC-APPROVAL-001');
  const [instrumentForm, setInstrumentForm] = React.useState({
    contractId: '',
    instrumentId: 'INSTR-MPC-001',
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
      const [investorResponse, validatedResponse, instrumentResponse] = await Promise.all([
        getApprovedInvestors(token),
        getValidatedContracts(token),
        getInstruments(token),
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
        const contractData = getDamlCreateArguments<{ contractData?: Record<string, unknown> }>({
          contractId: String(event.contractId),
          createArguments: event.createArguments,
        }).contractData ?? {};
        return {
          contractId: String(event.contractId),
          businessContractId: toStringValue(contractData.contractId, ''),
          propertyName: toStringValue(contractData.propertyName, 'Managed property'),
          propertyId: toStringValue(contractData.propertyId, ''),
        };
      }).filter((item) => item.contractId);

      const normalizedInstruments = instrumentResponse.map((event) => {
        const args = getDamlCreateArguments<{
          instrumentId?: unknown;
          totalUnits?: unknown;
          nominalValuePerUnit?: unknown;
          investorUpfrontPricePerUnit?: unknown;
          approvedInvestors?: unknown;
        }>({ contractId: String(event.contractId), createArguments: event.createArguments });

        return {
          contractId: String(event.contractId),
          instrumentId: toStringValue(args.instrumentId, ''),
          totalUnits: toNumber(args.totalUnits),
          nominalValuePerUnit: toNumber(args.nominalValuePerUnit),
          investorUpfrontPricePerUnit: toNumber(args.investorUpfrontPricePerUnit),
          approvedInvestors: Array.isArray(args.approvedInvestors)
            ? (args.approvedInvestors as unknown[]).map((item) => String(item))
            : [],
        };
      }).filter((item) => item.instrumentId);

      setApprovedInvestors(normalizedApproved as ApprovedInvestorRecord[]);
      setValidatedContracts(normalizedValidated as ValidatedContractRecord[]);
      setInstruments(normalizedInstruments as InstrumentRecord[]);

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
        title="Easycoin investor approval"
        description="Approve investor parties, then create the tokenized instrument from a validated managed contract."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved investors</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{approvedInvestors.length}</span>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validated contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{validatedContracts.length}</span>
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active instruments</CardTitle>
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

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70">
          <CardHeader className="space-y-2 border-b border-border/60">
            <CardTitle className="text-lg">Approve investor</CardTitle>
            <CardDescription>Use a Daml investor party ID and a business approval reference.</CardDescription>
          </CardHeader>
          <form onSubmit={handleApproveInvestor}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="investor-party">Investor party</Label>
                <Input
                  id="investor-party"
                  value={approvalInvestor}
                  onChange={(e) => setApprovalInvestor(e.target.value)}
                  placeholder={demoUsers.INVESTOR.partyId}
                />
                <p className="text-xs text-muted-foreground">Example: {demoUsers.INVESTOR.partyId}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="approval-reference">Approval reference</Label>
                <Input
                  id="approval-reference"
                  value={approvalReference}
                  onChange={(e) => setApprovalReference(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Approve investor
              </Button>
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggested parties</p>
                <div className="flex flex-wrap gap-2">
                  {sampleInvestors.map((item) => (
                    <button
                      key={item.partyId}
                      type="button"
                      onClick={() => setApprovalInvestor(item.partyId)}
                      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </form>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="space-y-2 border-b border-border/60">
            <CardTitle className="text-lg">Create tokenized instrument</CardTitle>
            <CardDescription>Select a validated contract and the approved investor parties.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateInstrument}>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
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
                <Label htmlFor="instrument-id">Instrument ID</Label>
                <Input
                  id="instrument-id"
                  value={instrumentForm.instrumentId}
                  onChange={(e) => setInstrumentForm((current) => ({ ...current, instrumentId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-units">Total units</Label>
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
                <Label htmlFor="upfront-price">Upfront price per unit</Label>
                <Input
                  id="upfront-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={instrumentForm.investorUpfrontPricePerUnit}
                  onChange={(e) => setInstrumentForm((current) => ({ ...current, investorUpfrontPricePerUnit: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2 space-y-3">
                <p className="text-sm font-medium">Approved investors for the instrument</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {approvedInvestors.map((item) => (
                    <label
                      key={item.contractId}
                      className="flex items-start gap-3 rounded-xl border border-border/60 p-3"
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
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.investor}</p>
                        <p className="text-xs text-muted-foreground">{item.approvalReference}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
            <div className="flex items-center justify-between gap-3 border-t border-border/60 px-6 py-5">
              <p className="text-sm text-muted-foreground">
                The backend will create TokenizedInstrument, TokenSupply, and the owner holding.
              </p>
              <Button type="submit" className="gap-2" disabled={saving || validatedContracts.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Create instrument
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Approved investors</CardTitle>
            <CardDescription>Active approval contracts returned by the backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedInvestors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                No approved investor yet.
              </div>
            ) : (
              approvedInvestors.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.investor}</p>
                      <p className="text-sm text-muted-foreground">{item.approvalReference}</p>
                    </div>
                    <StatusBadge status="Approved" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
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
              instruments.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.instrumentId}</p>
                      <p className="text-sm text-muted-foreground">{item.contractId}</p>
                    </div>
                    <StatusBadge status="Token instrument created" />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Units</p>
                      <p className="mt-1 text-sm font-medium">{item.totalUnits}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Approved investors</p>
                      <p className="mt-1 text-sm font-medium">{item.approvedInvestors.length}</p>
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

export default function InvestmentsPage() {
  const { session } = useSession();
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  if (session.role === 'EASYCOIN') {
    return <EasycoinInvestmentsWorkspace token={session.accessToken} />;
  }

  if (session.role === 'INVESTOR') {
    return <InvestorInvestmentsWorkspace token={session.accessToken} partyId={session.partyId} />;
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
