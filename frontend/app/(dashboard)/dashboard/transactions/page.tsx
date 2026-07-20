'use client';

import * as React from 'react';
import { Loader2, RefreshCw, FileText, ShieldCheck, PlusCircle, XCircle, CheckCircle2 } from 'lucide-react';

import { useSession } from '@/lib/session';
import {
  closeSettlement,
  createRewardRecords,
  getClosedContracts,
  getDamlCreateArguments,
  getInstruments,
  getRedemptionRecords,
  getRedemptionRecordsByInstrument,
  getRewardRecords,
  getSettlements,
  submitFinalReconciliation,
  toNumber,
  toStringValue,
} from '@/lib/platform-api';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, type Column } from '@/components/dashboard/data-table';
import { EmptyState } from '@/components/dashboard/empty-state';
import { SearchInput } from '@/components/dashboard/search-input';
import { FilterBar, type FilterOption } from '@/components/dashboard/filter-bar';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type SettlementRecord = {
  contractId: string;
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

type RewardRecord = {
  contractId: string;
  recipient: string;
  holdingCid: string;
};

type ClosedRecord = {
  contractId: string;
  instrumentId: string;
};

type InstrumentOption = {
  contractId: string;
  instrumentId: string;
};

const settlementFilters: FilterOption[] = [
  { label: 'Open', value: 'Open' },
  { label: 'Closed', value: 'Closed' },
];

function EasycoinTransactionsWorkspace({ token }: { token: string }) {
  const [settlements, setSettlements] = React.useState<SettlementRecord[]>([]);
  const [rewards, setRewards] = React.useState<RewardRecord[]>([]);
  const [closedContracts, setClosedContracts] = React.useState<ClosedRecord[]>([]);
  const [instruments, setInstruments] = React.useState<InstrumentOption[]>([]);
  const [selectedInstrumentId, setSelectedInstrumentId] = React.useState('');
  const [reconciliationCid, setReconciliationCid] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [rewardForm, setRewardForm] = React.useState({ holdingCids: '', closureNote: 'All rewards have been created and settlement is ready to close.' });
  const [reconciliationForm, setReconciliationForm] = React.useState({
    instrumentId: '',
    totalRentalIncome: '120000',
    totalExpenses: '24000',
    netProfitBeforeFee: '96000',
    easycoinFee: '19200',
    ownerSideDistributableProfit: '76800',
    investorRewardPool: '38400',
    ownerRetainedProfit: '38400',
    finalReportHash: 'HASH-FINAL-REPORT-001',
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [settlementResponse, rewardResponse, closedResponse, instrumentResponse] = await Promise.all([
        getSettlements(token),
        getRewardRecords(token),
        getClosedContracts(token),
        getInstruments(token),
      ]);

      setSettlements(
        settlementResponse
          .map((event) => {
            const args = getDamlCreateArguments<{
              instrumentId?: unknown;
              totalRentalIncome?: unknown;
              totalExpenses?: unknown;
              netProfitBeforeFee?: unknown;
              easycoinFee?: unknown;
              ownerSideDistributableProfit?: unknown;
              investorRewardPool?: unknown;
              ownerRetainedProfit?: unknown;
              finalReportHash?: unknown;
            }>({ contractId: String(event.contractId), createArguments: event.createArguments });
            return {
              contractId: String(event.contractId),
              instrumentId: toStringValue(args.instrumentId, ''),
              totalRentalIncome: toNumber(args.totalRentalIncome),
              totalExpenses: toNumber(args.totalExpenses),
              netProfitBeforeFee: toNumber(args.netProfitBeforeFee),
              easycoinFee: toNumber(args.easycoinFee),
              ownerSideDistributableProfit: toNumber(args.ownerSideDistributableProfit),
              investorRewardPool: toNumber(args.investorRewardPool),
              ownerRetainedProfit: toNumber(args.ownerRetainedProfit),
              finalReportHash: toStringValue(args.finalReportHash, ''),
            };
          })
          .filter((item) => item.instrumentId) as SettlementRecord[]
      );

      setRewards(
        rewardResponse
          .map((event) => {
            const args = getDamlCreateArguments<{ recipient?: unknown; holdingCid?: unknown }>({
              contractId: String(event.contractId),
              createArguments: event.createArguments,
            });
            return {
              contractId: String(event.contractId),
              recipient: toStringValue(args.recipient, ''),
              holdingCid: toStringValue(args.holdingCid, ''),
            };
          })
          .filter((item) => item.recipient) as RewardRecord[]
      );

      setClosedContracts(
        closedResponse
          .map((event) => {
            const args = getDamlCreateArguments<{ instrumentId?: unknown }>({
              contractId: String(event.contractId),
              createArguments: event.createArguments,
            });
            return {
              contractId: String(event.contractId),
              instrumentId: toStringValue(args.instrumentId, ''),
            };
          })
          .filter((item) => item.instrumentId) as ClosedRecord[]
      );

      const normalizedInstruments = instrumentResponse.map((event) => {
        const args = getDamlCreateArguments<{ instrumentId?: unknown }>({
          contractId: String(event.contractId),
          createArguments: event.createArguments,
        });
        return {
          contractId: String(event.contractId),
          instrumentId: toStringValue(args.instrumentId, ''),
        };
      }).filter((item) => item.instrumentId);

      setInstruments(normalizedInstruments as InstrumentOption[]);
      if (!selectedInstrumentId && normalizedInstruments[0]) {
        setSelectedInstrumentId(normalizedInstruments[0].instrumentId);
        setReconciliationForm((current) => ({
          ...current,
          instrumentId: normalizedInstruments[0].instrumentId,
        }));
      }

      if (!reconciliationCid && settlementResponse[0]) {
        setReconciliationCid(String(settlementResponse[0].contractId));
      }
    } finally {
      setLoading(false);
    }
  }, [reconciliationCid, selectedInstrumentId, token]);

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

  const handleSubmitReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await submitFinalReconciliation(token, {
        instrumentId: reconciliationForm.instrumentId,
        totalRentalIncome: toNumber(reconciliationForm.totalRentalIncome),
        totalExpenses: toNumber(reconciliationForm.totalExpenses),
        netProfitBeforeFee: toNumber(reconciliationForm.netProfitBeforeFee),
        easycoinFee: toNumber(reconciliationForm.easycoinFee),
        ownerSideDistributableProfit: toNumber(reconciliationForm.ownerSideDistributableProfit),
        investorRewardPool: toNumber(reconciliationForm.investorRewardPool),
        ownerRetainedProfit: toNumber(reconciliationForm.ownerRetainedProfit),
        finalReportHash: reconciliationForm.finalReportHash,
      });
      toast.success('Final reconciliation submitted');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit reconciliation');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRewards = async () => {
    if (!reconciliationCid) {
      toast.error('Select a reconciliation CID');
      return;
    }

    setSaving(true);
    try {
      await createRewardRecords(token, reconciliationCid, {
        holdingCids: rewardForm.holdingCids
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      toast.success('Reward records created');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create reward records');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSettlement = async () => {
    if (!reconciliationCid) {
      toast.error('Select a reconciliation CID');
      return;
    }

    setSaving(true);
    try {
      await closeSettlement(token, reconciliationCid, {
        closureNote: rewardForm.closureNote,
      });
      toast.success('Settlement closed');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to close settlement');
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
        title="Easycoin settlement center"
        description="Submit final reconciliation, create reward records, and close the contract."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Settlements</CardTitle>
          </CardHeader>
          <CardContent><span className="text-2xl font-semibold">{settlements.length}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reward records</CardTitle>
          </CardHeader>
          <CardContent><span className="text-2xl font-semibold">{rewards.length}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed contracts</CardTitle>
          </CardHeader>
          <CardContent><span className="text-2xl font-semibold">{closedContracts.length}</span></CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70">
          <CardHeader className="space-y-2 border-b border-border/60">
            <CardTitle className="text-lg">Submit final reconciliation</CardTitle>
            <CardDescription>Use the selected tokenized instrument to calculate the settlement.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitReconciliation}>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Instrument</Label>
                <Select value={reconciliationForm.instrumentId} onValueChange={(value) => setReconciliationForm((current) => ({ ...current, instrumentId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    {instruments.map((item) => (
                      <SelectItem key={item.contractId} value={item.instrumentId}>
                        {item.instrumentId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total rental income</Label>
                <Input type="number" value={reconciliationForm.totalRentalIncome} onChange={(e) => setReconciliationForm((current) => ({ ...current, totalRentalIncome: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Total expenses</Label>
                <Input type="number" value={reconciliationForm.totalExpenses} onChange={(e) => setReconciliationForm((current) => ({ ...current, totalExpenses: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Net profit before fee</Label>
                <Input type="number" value={reconciliationForm.netProfitBeforeFee} onChange={(e) => setReconciliationForm((current) => ({ ...current, netProfitBeforeFee: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Easycoin fee</Label>
                <Input type="number" value={reconciliationForm.easycoinFee} onChange={(e) => setReconciliationForm((current) => ({ ...current, easycoinFee: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Owner distributable profit</Label>
                <Input type="number" value={reconciliationForm.ownerSideDistributableProfit} onChange={(e) => setReconciliationForm((current) => ({ ...current, ownerSideDistributableProfit: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Investor reward pool</Label>
                <Input type="number" value={reconciliationForm.investorRewardPool} onChange={(e) => setReconciliationForm((current) => ({ ...current, investorRewardPool: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Owner retained profit</Label>
                <Input type="number" value={reconciliationForm.ownerRetainedProfit} onChange={(e) => setReconciliationForm((current) => ({ ...current, ownerRetainedProfit: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Final report hash</Label>
                <Input value={reconciliationForm.finalReportHash} onChange={(e) => setReconciliationForm((current) => ({ ...current, finalReportHash: e.target.value }))} />
              </div>
            </CardContent>
            <div className="flex items-center justify-between gap-3 border-t border-border/60 px-6 py-5">
              <p className="text-sm text-muted-foreground">Final reconciliation is the source for rewards and closure.</p>
              <Button type="submit" className="gap-2" disabled={saving || instruments.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Submit reconciliation
              </Button>
            </div>
          </form>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="space-y-2 border-b border-border/60">
            <CardTitle className="text-lg">Create rewards and close</CardTitle>
            <CardDescription>Use a reconciliation CID to create reward records and close the contract.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Reconciliation CID</Label>
              <Select value={reconciliationCid} onValueChange={setReconciliationCid}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reconciliation" />
                </SelectTrigger>
                <SelectContent>
                  {settlements.map((item) => (
                    <SelectItem key={item.contractId} value={item.contractId}>
                      {item.contractId} - {item.instrumentId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Holding CIDs</Label>
              <Input
                value={rewardForm.holdingCids}
                onChange={(e) => setRewardForm((current) => ({ ...current, holdingCids: e.target.value }))}
                placeholder="Optional, comma separated"
              />
            </div>
            <Button className="w-full gap-2" onClick={handleCreateRewards} disabled={saving || !reconciliationCid}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Create reward records
            </Button>
            <div className="space-y-2">
              <Label>Closure note</Label>
              <Input
                value={rewardForm.closureNote}
                onChange={(e) => setRewardForm((current) => ({ ...current, closureNote: e.target.value }))}
              />
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={handleCloseSettlement} disabled={saving || !reconciliationCid}>
              <XCircle className="h-4 w-4" />
              Close settlement
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Settlements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settlements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No reconciliation yet.</div>
            ) : (
              settlements.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <p className="font-medium">{item.instrumentId}</p>
                  <p className="text-sm text-muted-foreground">{item.contractId}</p>
                  <div className="mt-2"><StatusBadge status="Reconciled" /></div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Reward records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rewards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No reward record yet.</div>
            ) : (
              rewards.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <p className="font-medium">{item.recipient}</p>
                  <p className="text-sm text-muted-foreground">{item.holdingCid}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Closed contracts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {closedContracts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No closed contract yet.</div>
            ) : (
              closedContracts.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <p className="font-medium">{item.instrumentId}</p>
                  <p className="text-sm text-muted-foreground">{item.contractId}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

type InvestorTransactionRecord = {
  contractId: string;
  instrumentId: string;
  status: string;
  amount?: number;
  reference?: string;
};

function InvestorTransactionsWorkspace({ token }: { token: string }) {
  const [settlements, setSettlements] = React.useState<InvestorTransactionRecord[]>([]);
  const [rewards, setRewards] = React.useState<InvestorTransactionRecord[]>([]);
  const [closedContracts, setClosedContracts] = React.useState<InvestorTransactionRecord[]>([]);
  const [redemptions, setRedemptions] = React.useState<InvestorTransactionRecord[]>([]);
  const [redemptionsByInstrument, setRedemptionsByInstrument] = React.useState<InvestorTransactionRecord[]>([]);
  const [instruments, setInstruments] = React.useState<InstrumentOption[]>([]);
  const [selectedInstrumentId, setSelectedInstrumentId] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [settlementResponse, rewardResponse, closedResponse, redemptionResponse, instrumentResponse] = await Promise.all([
        getSettlements(token),
        getRewardRecords(token),
        getClosedContracts(token),
        getRedemptionRecords(token),
        getInstruments(token),
      ]);

      const normalizedInstruments = instrumentResponse
        .map((event) => {
          const args = getDamlCreateArguments<{ instrumentId?: unknown }>({
            contractId: String(event.contractId),
            createArguments: event.createArguments,
          });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
          };
        })
        .filter((item) => item.instrumentId);

      const effectiveInstrumentId = selectedInstrumentId || normalizedInstruments[0]?.instrumentId || '';
      const byInstrumentResponse = effectiveInstrumentId
        ? await getRedemptionRecordsByInstrument(token, effectiveInstrumentId).catch(() => [])
        : [];

      setInstruments(normalizedInstruments as InstrumentOption[]);
      setSelectedInstrumentId(effectiveInstrumentId);
      setSettlements(
        settlementResponse.map((event) => {
          const args = getDamlCreateArguments<{
            instrumentId?: unknown;
            investorRewardPool?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            amount: toNumber(args.investorRewardPool),
            status: toStringValue(args.status, 'RECONCILED'),
          };
        }).filter((item) => item.instrumentId)
      );
      setRewards(
        rewardResponse.map((event) => {
          const args = getDamlCreateArguments<{
            instrumentId?: unknown;
            rewardAmount?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            amount: toNumber(args.rewardAmount),
            status: toStringValue(args.status, 'PAYMENT_PENDING'),
          };
        }).filter((item) => item.instrumentId)
      );
      setClosedContracts(
        closedResponse.map((event) => {
          const args = getDamlCreateArguments<{
            instrumentId?: unknown;
            closureNote?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            reference: toStringValue(args.closureNote, ''),
            status: toStringValue(args.status, 'CLOSED'),
          };
        }).filter((item) => item.instrumentId)
      );

      const mapRedemption = (event: { contractId: string; createArguments?: Record<string, unknown> }) => {
        const args = getDamlCreateArguments<{
          instrumentId?: unknown;
          redeemedUnits?: unknown;
          burnReference?: unknown;
          status?: unknown;
        }>({ contractId: String(event.contractId), createArguments: event.createArguments });
        return {
          contractId: String(event.contractId),
          instrumentId: toStringValue(args.instrumentId, ''),
          amount: toNumber(args.redeemedUnits),
          reference: toStringValue(args.burnReference, ''),
          status: toStringValue(args.status, 'TOKENS_REDEEMED_BURNED'),
        };
      };

      setRedemptions(redemptionResponse.map(mapRedemption).filter((item) => item.instrumentId));
      setRedemptionsByInstrument(byInstrumentResponse.map(mapRedemption).filter((item) => item.instrumentId));
    } finally {
      setLoading(false);
    }
  }, [selectedInstrumentId, token]);

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
        title="Investor audit trail"
        description="Read settlement, reward, closure, and redemption records visible to your investor party."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Settlements</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{settlements.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rewards</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{rewards.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{closedContracts.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Redemptions</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{redemptions.length}</span></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Redemptions by instrument</CardTitle>
            <CardDescription>Uses `/redemptions/instrument/:instrumentId`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedInstrumentId} onValueChange={setSelectedInstrumentId}>
              <SelectTrigger><SelectValue placeholder="Select instrument" /></SelectTrigger>
              <SelectContent>
                {instruments.map((item) => (
                  <SelectItem key={item.contractId} value={item.instrumentId}>{item.instrumentId}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {redemptionsByInstrument.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">No redemption for selected instrument.</div>
            ) : (
              redemptionsByInstrument.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.instrumentId}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{item.amount} units - {item.reference}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Lifecycle records</CardTitle>
            <CardDescription>Final reconciliation, rewards, closure, and burn records.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[...settlements, ...rewards, ...closedContracts, ...redemptions].length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground sm:col-span-2">No lifecycle transaction yet.</div>
            ) : (
              [...settlements, ...rewards, ...closedContracts, ...redemptions].map((item) => (
                <div key={`${item.contractId}-${item.status}`} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.instrumentId}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.amount !== undefined && item.amount > 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">{item.amount}</p>
                  )}
                  {item.reference && <p className="mt-1 text-xs text-muted-foreground">{item.reference}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function TransactionsPage() {
  const { session } = useSession();

  if (session.role === 'EASYCOIN') {
    return <EasycoinTransactionsWorkspace token={session.accessToken} />;
  }

  if (session.role === 'INVESTOR') {
    return <InvestorTransactionsWorkspace token={session.accessToken} />;
  }

  return (
    <>
      <PageHeader
        title="Audit trail"
        description="A lifecycle log for the managed contract, funding, reconciliation, closure, and burn."
      >
        <Button variant="outline" size="sm" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Export audit
        </Button>
      </PageHeader>
      <Card className="border-border/70">
        <CardContent className="px-6 py-10 text-sm text-muted-foreground">
          Use an Easycoin account to open the operational settlement workspace.
        </CardContent>
      </Card>
    </>
  );
}
