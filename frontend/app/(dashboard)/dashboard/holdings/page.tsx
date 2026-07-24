'use client';

import * as React from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/lib/session';
import {
  getDamlCreateArguments,
  getHoldingByCid,
  getClosedContracts,
  getHoldings,
  getHoldingsByHolder,
  getHoldingsByInstrument,
  redeemHolding,
  toNumber,
  toStringValue,
} from '@/lib/platform-api';
import type { AppRole } from '@/lib/role-config';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type HoldingRecord = {
  holdingCid: string;
  holder: string;
  instrumentId: string;
  managedContractId: string;
  amount: number;
  status: string;
};

type ClosedContractOption = {
  contractId: string;
  managedContractId: string;
  instrumentId: string;
};

const allowedRoles: AppRole[] = [
  'OWNER',
  'INVESTOR',
  'EASYCOIN',
  'AUDITOR',
  'LEGAL_ADMIN',
  'PAYMENT_VERIFIER',
];

function mapHolding(event: { contractId: string; createArguments?: Record<string, unknown> }): HoldingRecord {
  const args = getDamlCreateArguments<{
    holder?: unknown;
    contractId?: unknown;
    instrumentId?: unknown;
    instrumentIdText?: unknown;
    amount?: unknown;
    units?: unknown;
    status?: unknown;
  }>({ contractId: String(event.contractId), createArguments: event.createArguments });

  return {
    holdingCid: String(event.contractId),
    holder: toStringValue(args.holder, ''),
    instrumentId: toStringValue(args.instrumentIdText ?? args.instrumentId, ''),
    managedContractId: toStringValue(args.contractId, ''),
    amount: toNumber(args.amount ?? args.units),
    status: toStringValue(args.status, 'ACTIVE'),
  };
}

function displayPartyName(partyId: string) {
  return partyId.split('::')[0] || 'Visible holder';
}

function shortenReference(value: string) {
  return value.length > 18 ? `${value.slice(0, 18)}...` : value;
}

function belongsToClosedContract(item: HoldingRecord, closed: ClosedContractOption) {
  const hasContractIds = Boolean(item.managedContractId && closed.managedContractId);
  const sameContract = hasContractIds
    ? item.managedContractId === closed.managedContractId
    : item.instrumentId === closed.instrumentId;
  const sameInstrument = item.instrumentId === closed.instrumentId;

  return sameContract && sameInstrument && item.status.toUpperCase() === 'ACTIVE';
}

function dedupeHoldings(items: HoldingRecord[]) {
  const byCid = new Map<string, HoldingRecord>();

  items.forEach((item) => {
    if (item.holdingCid && item.instrumentId) {
      byCid.set(item.holdingCid, item);
    }
  });

  return Array.from(byCid.values());
}

export default function HoldingsPage() {
  const { session } = useSession();
  const [holdings, setHoldings] = React.useState<HoldingRecord[]>([]);
  const [instrumentHoldings, setInstrumentHoldings] = React.useState<HoldingRecord[]>([]);
  const [holderHoldings, setHolderHoldings] = React.useState<HoldingRecord[]>([]);
  const [cidHolding, setCidHolding] = React.useState<HoldingRecord | null>(null);
  const [instrumentId, setInstrumentId] = React.useState('INSTR-MPC-001');
  const [holder, setHolder] = React.useState(session.partyId);
  const [holdingCid, setHoldingCid] = React.useState('');
  const [holderFilter, setHolderFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [burnReferencePrefix, setBurnReferencePrefix] = React.useState('BURN-INSTR-MPC-001');
  const [redeemClosedCid, setRedeemClosedCid] = React.useState('');
  const [redeemHoldingCid, setRedeemHoldingCid] = React.useState('');
  const [burnReference, setBurnReference] = React.useState('BURN-INSTR-MPC-001-INVESTOR-1');
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [closedContracts, setClosedContracts] = React.useState<ClosedContractOption[]>([]);

  const canUseHoldings = allowedRoles.includes(session.role);

  const loadData = React.useCallback(async () => {
    if (!canUseHoldings) return;

    setLoading(true);
    try {
      const [holdingResponse, byInstrumentResponse, byHolderResponse, byCidResponse, closedResponse] = await Promise.all([
        getHoldings(session.accessToken),
        instrumentId.trim()
          ? getHoldingsByInstrument(session.accessToken, instrumentId.trim()).catch(() => [])
          : Promise.resolve([]),
        holder.trim()
          ? getHoldingsByHolder(session.accessToken, holder.trim()).catch(() => [])
          : Promise.resolve([]),
        holdingCid.trim()
          ? getHoldingByCid(session.accessToken, holdingCid.trim()).catch(() => [])
          : Promise.resolve([]),
        getClosedContracts(session.accessToken),
      ]);

      const normalized = holdingResponse.map(mapHolding).filter((item) => item.instrumentId);
      const byInstrument = byInstrumentResponse.map(mapHolding).filter((item) => item.instrumentId);
      const byHolder = byHolderResponse.map(mapHolding).filter((item) => item.instrumentId);
      const byCid = byCidResponse.map(mapHolding).filter((item) => item.instrumentId);
      const closed = closedResponse
        .map((event) => {
          const args = getDamlCreateArguments<{ contractId?: unknown; instrumentId?: unknown }>({
            contractId: String(event.contractId),
            createArguments: event.createArguments,
          });
          return {
            contractId: String(event.contractId),
            managedContractId: toStringValue(args.contractId, ''),
            instrumentId: toStringValue(args.instrumentId, ''),
          };
        })
        .filter((item) => item.instrumentId);

      setHoldings(normalized);
      setInstrumentHoldings(byInstrument);
      setHolderHoldings(byHolder);
      setCidHolding(byCid[0] ?? null);
      setClosedContracts(closed);
      if (!redeemClosedCid && closed[0]) {
        setRedeemClosedCid(closed[0].contractId);
        setBurnReferencePrefix(`BURN-${closed[0].instrumentId}`);
        const firstHolding = normalized.find(
          (item) => belongsToClosedContract(item, closed[0]),
        );
        setRedeemHoldingCid(firstHolding?.holdingCid ?? '');
        if (firstHolding) {
          setBurnReference(`BURN-${closed[0].instrumentId}-${displayPartyName(firstHolding.holder)}`);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load holdings');
    } finally {
      setLoading(false);
    }
  }, [canUseHoldings, holdingCid, holder, instrumentId, redeemClosedCid, session.accessToken]);

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

  const selectedClosedContract = closedContracts.find((item) => item.contractId === redeemClosedCid);
  const eligibleRedeemHoldings = selectedClosedContract
    ? holdings.filter((item) => belongsToClosedContract(item, selectedClosedContract))
    : [];

  const handleRedeemAll = async () => {
    if (!redeemClosedCid.trim()) {
      toast.error('Enter a closed contract CID');
      return;
    }

    const selectedContract = closedContracts.find((item) => item.contractId === redeemClosedCid.trim());
    const matchingHoldings = selectedContract
      ? holdings.filter((item) => belongsToClosedContract(item, selectedContract))
      : [];

    if (!selectedContract || matchingHoldings.length === 0) {
      toast.error('No active holdings found for the selected closed contract');
      return;
    }

    setPendingAction('redeem-all');
    try {
      for (const holding of matchingHoldings) {
        await redeemHolding(session.accessToken, redeemClosedCid.trim(), {
          holdingCid: holding.holdingCid,
          burnReference: `${burnReferencePrefix.trim() || `BURN-${selectedContract.instrumentId}`}-${holding.holdingCid.slice(0, 8)}`,
        });
      }
      toast.success(`${matchingHoldings.length} holding(s) redeemed`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to redeem all holdings');
    } finally {
      setPendingAction(null);
    }
  };

  const handleRedeemHolding = async () => {
    if (!redeemClosedCid.trim() || !redeemHoldingCid.trim() || !burnReference.trim()) {
      toast.error('Enter closed CID, holding CID, and burn reference');
      return;
    }

    setPendingAction(redeemHoldingCid.trim());
    try {
      await redeemHolding(session.accessToken, redeemClosedCid.trim(), {
        holdingCid: redeemHoldingCid.trim(),
        burnReference: burnReference.trim(),
      });
      toast.success('Holding redeemed and burned');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to redeem holding');
    } finally {
      setPendingAction(null);
    }
  };

  if (!canUseHoldings) {
    return (
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Holdings view</CardTitle>
          <CardDescription>This screen is reserved for ledger-visible operational roles.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tableRows = dedupeHoldings([
    ...holdings,
    ...instrumentHoldings,
    ...holderHoldings,
    ...(cidHolding ? [cidHolding] : []),
  ]);
  const holderOptions = Array.from(new Set(tableRows.map((item) => item.holder).filter(Boolean)));
  const visibleRows = holderFilter === 'all'
    ? tableRows
    : tableRows.filter((item) => item.holder === holderFilter);
  const totalUnits = visibleRows.reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <PageHeader
        title="Holdings view"
        description="Verify active holdings before rewards and redemption. Owners see retained units; investors see subscribed units where visible on the ledger."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">All holdings</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{holdings.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">By instrument</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{instrumentHoldings.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">By holder</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{holderHoldings.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total units</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{totalUnits}</span></CardContent></Card>
      </div>

      <Card className="mt-6 border-border/70">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Optional filters</CardTitle>
          <CardDescription>Use instrument, holder, or Daml holding CID lookups to verify a specific active holding.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label>Instrument ID</Label>
            <Input value={instrumentId} onChange={(event) => setInstrumentId(event.target.value)} placeholder="INSTR-MPC-001" />
          </div>
          <div className="space-y-2">
            <Label>Holder party</Label>
            <Input value={holder} onChange={(event) => setHolder(event.target.value)} placeholder={session.partyId} />
          </div>
          <div className="space-y-2">
            <Label>Holding CID</Label>
            <Input value={holdingCid} onChange={(event) => setHoldingCid(event.target.value)} placeholder="00f7c1..." />
          </div>
          <div className="flex items-end">
            <Button className="w-full gap-2 lg:w-auto" onClick={refresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <CardTitle className="text-lg">Active holdings</CardTitle>
            <CardDescription>Review the units currently held by each participant.</CardDescription>
          </div>
          <div className="w-full sm:w-56">
            <Label htmlFor="holder-filter" className="text-xs text-muted-foreground">Filter by holder</Label>
            <Select value={holderFilter} onValueChange={setHolderFilter}>
              <SelectTrigger id="holder-filter" className="mt-1 rounded-xl">
                <SelectValue placeholder="All holders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All holders</SelectItem>
                {holderOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {displayPartyName(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {visibleRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-sm text-muted-foreground">
              No active holding is visible for this role and filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Holder</TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Record reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((item) => (
                    <TableRow key={item.holdingCid} className="transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">{displayPartyName(item.holder)}</TableCell>
                      <TableCell className="font-medium">{item.instrumentId}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{item.amount}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground" title={item.holdingCid}>{shortenReference(item.holdingCid)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {session.role === 'EASYCOIN' ? (
        <Card className="mt-6 border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Easycoin redemption</CardTitle>
            <CardDescription>
              Redeem and burn holdings after the managed contract is closed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Closed contract CID</Label>
                <Select
                  value={redeemClosedCid}
                  onValueChange={(contractId) => {
                    const selected = closedContracts.find((item) => item.contractId === contractId);
                    setRedeemClosedCid(contractId);
                    if (selected) {
                      setBurnReferencePrefix(`BURN-${selected.instrumentId}`);
                      const firstHolding = holdings.find(
                        (item) => belongsToClosedContract(item, selected),
                      );
                      setRedeemHoldingCid(firstHolding?.holdingCid ?? '');
                      if (firstHolding) {
                        setBurnReference(`BURN-${selected.instrumentId}-${displayPartyName(firstHolding.holder)}`);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a closed contract" />
                  </SelectTrigger>
                  <SelectContent>
                    {closedContracts.map((item) => (
                      <SelectItem key={item.contractId} value={item.contractId}>
                        {item.instrumentId} · {shortenReference(item.contractId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Burn reference prefix</Label>
                <Input
                  value={burnReferencePrefix}
                  onChange={(event) => setBurnReferencePrefix(event.target.value)}
                  placeholder="BURN-INSTR-MPC-001"
                />
              </div>
              <Button
                className="gap-2"
                onClick={handleRedeemAll}
                disabled={pendingAction === 'redeem-all'}
              >
                {pendingAction === 'redeem-all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Redeem all holdings
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Holding CID</Label>
                <Select
                  value={redeemHoldingCid}
                  onValueChange={(value) => {
                    setRedeemHoldingCid(value);
                    const selected = eligibleRedeemHoldings.find((item) => item.holdingCid === value);
                    if (selectedClosedContract && selected) {
                      setBurnReference(`BURN-${selectedClosedContract.instrumentId}-${displayPartyName(selected.holder)}`);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a holding" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleRedeemHoldings.map((item) => (
                      <SelectItem key={item.holdingCid} value={item.holdingCid}>
                        {displayPartyName(item.holder)} · {item.amount} units · {shortenReference(item.holdingCid)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Keep the complete CID available to the action without exposing a technical input. */}
                <input type="hidden"
                  value={redeemHoldingCid}
                />
              </div>
              <div className="space-y-2">
                <Label>Burn reference</Label>
                <Input
                  value={burnReference}
                  onChange={(event) => setBurnReference(event.target.value)}
                  placeholder="BURN-INSTR-MPC-001-INVESTOR-1"
                />
              </div>
              <Button
                className="gap-2"
                onClick={handleRedeemHolding}
                disabled={pendingAction === redeemHoldingCid.trim() && redeemHoldingCid.trim().length > 0}
              >
                {pendingAction === redeemHoldingCid.trim() ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Redeem holding
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
