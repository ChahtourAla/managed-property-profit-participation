'use client';

import * as React from 'react';
import { Coins, Loader2, PlusCircle, RefreshCw, ShieldCheck, Users } from 'lucide-react';

import { investments, type Investment } from '@/lib/mock-investments';
import { formatCurrency, formatDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import {
  approveInvestor,
  createInstrument,
  getApprovedInvestors,
  getDamlCreateArguments,
  getInstruments,
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

export default function InvestmentsPage() {
  const { session } = useSession();
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  if (session.role === 'EASYCOIN') {
    return <EasycoinInvestmentsWorkspace token={session.accessToken} />;
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
