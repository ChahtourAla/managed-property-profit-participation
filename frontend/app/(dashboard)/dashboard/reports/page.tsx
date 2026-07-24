'use client';

import * as React from 'react';
import {
  BadgeCheck,
  CalendarRange,
  FileText,
  Loader2,
  Lock,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from 'lucide-react';

import { useSession } from '@/lib/session';
import {
  acceptReport,
  createPerformanceReport,
  getAcceptedReports,
  getDamlCreateArguments,
  getClosedContracts,
  getInstruments,
  getPaymentRewards,
  getRewardPaymentConfirmations,
  getReports,
  getReportsByInstrument,
  getRewardRecords,
  getSettlements,
  toNumber,
  toStringValue,
} from '@/lib/platform-api';
import { localDamlParties } from '@/lib/role-config';
import { PageHeader } from '@/components/dashboard/page-header';
import { ChartCard } from '@/components/dashboard/chart-card';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { PortfolioChart } from '@/components/charts/portfolio-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const summaryStats = [
  { label: 'Net profit before fee', value: 96000, icon: TrendingUp },
  { label: 'Easycoin fee', value: 19200, icon: Lock },
  { label: 'Investor reward pool', value: 38400, icon: WalletCards },
  { label: 'Owner retained share', value: 38400, icon: BadgeCheck },
];

const steps = [
  {
    title: 'Performance report',
    status: 'Accepted',
    description: 'Income, expenses, report hash, and provisional figures are recorded.',
  },
  {
    title: 'Final reconciliation',
    status: 'Reconciled',
    description: 'Backend calculates the final values and records them on Canton.',
  },
  {
    title: 'Reward records',
    status: 'Reward distributed',
    description: 'Reward records are created from token holdings.',
  },
  {
    title: 'Payment confirmation',
    status: 'Paid',
    description: 'Payment verifier confirms the reward transfers.',
  },
  {
    title: 'Closure and burn',
    status: 'Closed',
    description: 'The contract closes and tokens are redeemed or burned.',
  },
];

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

type ReportRecord = {
  contractId: string;
  instrumentId: string;
  periodLabel: string;
  reportHash: string;
};

type InstrumentOption = {
  contractId: string;
  instrumentId: string;
};

function EasycoinReportsWorkspace({ token }: { token: string }) {
  const [reports, setReports] = React.useState<ReportRecord[]>([]);
  const [acceptedReports, setAcceptedReports] = React.useState<ReportRecord[]>([]);
  const [instruments, setInstruments] = React.useState<InstrumentOption[]>([]);
  const [form, setForm] = React.useState({
    instrumentId: '',
    periodLabel: '2026-Q3',
    rentalIncome: '120000',
    expenses: '24000',
    estimatedNetProfit: '96000',
    reportUri: 'ipfs://performance-report-mpc-001',
    reportHash: 'HASH-PERFORMANCE-REPORT-001',
    isFinal: true,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [reportResponse, acceptedResponse, instrumentResponse] = await Promise.all([
        getReports(token),
        getAcceptedReports(token),
        getInstruments(token),
      ]);

      const normalizedReports = reportResponse.map((event) => {
        const args = getDamlCreateArguments<{
          instrumentId?: unknown;
          periodLabel?: unknown;
          reportHash?: unknown;
        }>({ contractId: String(event.contractId), createArguments: event.createArguments });
        return {
          contractId: String(event.contractId),
          instrumentId: toStringValue(args.instrumentId, ''),
          periodLabel: toStringValue(args.periodLabel, ''),
          reportHash: toStringValue(args.reportHash, ''),
        };
      }).filter((item) => item.instrumentId);

      const normalizedAccepted = acceptedResponse.map((event) => {
        const args = getDamlCreateArguments<{
          instrumentId?: unknown;
          periodLabel?: unknown;
          reportHash?: unknown;
        }>({ contractId: String(event.contractId), createArguments: event.createArguments });
        return {
          contractId: String(event.contractId),
          instrumentId: toStringValue(args.instrumentId, ''),
          periodLabel: toStringValue(args.periodLabel, ''),
          reportHash: toStringValue(args.reportHash, ''),
        };
      }).filter((item) => item.instrumentId);

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

      setReports(normalizedReports as ReportRecord[]);
      setAcceptedReports(normalizedAccepted as ReportRecord[]);
      setInstruments(normalizedInstruments as InstrumentOption[]);
      if (!form.instrumentId && normalizedInstruments[0]) {
        setForm((current) => ({ ...current, instrumentId: normalizedInstruments[0].instrumentId }));
      }
    } finally {
      setLoading(false);
    }
  }, [form.instrumentId, token]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPerformanceReport(token, {
        instrumentId: form.instrumentId,
        periodLabel: form.periodLabel,
        rentalIncome: toNumber(form.rentalIncome),
        expenses: toNumber(form.expenses),
        estimatedNetProfit: toNumber(form.estimatedNetProfit),
        reportUri: form.reportUri,
        reportHash: form.reportHash,
        isFinal: form.isFinal,
      });
      toast.success('Performance report created');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create report');
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
        title="Easycoin reporting"
        description="Create the performance report and track accepted reporting records before settlement."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{reports.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{acceptedReports.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Instruments</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{instruments.length}</span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70">
          <CardHeader className="space-y-2 border-b border-border/60">
            <CardTitle className="text-lg">Create performance report</CardTitle>
            <CardDescription>Attach the report to the selected tokenized instrument.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Instrument</Label>
                <Select value={form.instrumentId} onValueChange={(value) => setForm((current) => ({ ...current, instrumentId: value }))}>
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
                <Label htmlFor="periodLabel">Period</Label>
                <Input id="periodLabel" value={form.periodLabel} onChange={(e) => setForm((current) => ({ ...current, periodLabel: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportHash">Report hash</Label>
                <Input id="reportHash" value={form.reportHash} onChange={(e) => setForm((current) => ({ ...current, reportHash: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentalIncome">Rental income</Label>
                <Input id="rentalIncome" type="number" value={form.rentalIncome} onChange={(e) => setForm((current) => ({ ...current, rentalIncome: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenses">Expenses</Label>
                <Input id="expenses" type="number" value={form.expenses} onChange={(e) => setForm((current) => ({ ...current, expenses: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedNetProfit">Net profit</Label>
                <Input id="estimatedNetProfit" type="number" value={form.estimatedNetProfit} onChange={(e) => setForm((current) => ({ ...current, estimatedNetProfit: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportUri">Report URI</Label>
                <Input id="reportUri" value={form.reportUri} onChange={(e) => setForm((current) => ({ ...current, reportUri: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <Checkbox
                  checked={form.isFinal}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, isFinal: Boolean(checked) }))}
                />
                <Label>Mark as final report</Label>
              </div>
            </CardContent>
            <div className="flex items-center justify-between gap-3 border-t border-border/60 px-6 py-5">
              <p className="text-sm text-muted-foreground">
                The backend stores the report on the selected instrument.
              </p>
              <Button type="submit" className="gap-2" disabled={saving || instruments.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Create report
              </Button>
            </div>
          </form>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Report state</CardTitle>
            <CardDescription>Performance reports and accepted records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Performance reports</p>
              {reports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No report yet.</div>
              ) : (
                reports.map((item) => (
                  <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.instrumentId}</p>
                        <p className="text-sm text-muted-foreground">{item.periodLabel}</p>
                      </div>
                      <Badge variant="outline">Report</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Accepted reports</p>
              {acceptedReports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No accepted report yet.</div>
              ) : (
                acceptedReports.map((item) => (
                  <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.instrumentId}</p>
                        <p className="text-sm text-muted-foreground">{item.periodLabel}</p>
                      </div>
                      <Badge variant="secondary">Accepted</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

type InvestorReportSummary = {
  contractId: string;
  instrumentId: string;
  periodLabel: string;
  reportHash: string;
};

type InvestorLedgerSummary = {
  contractId: string;
  instrumentId: string;
  amount: number;
  status: string;
};

function InvestorReportsWorkspace({
  token,
  roleLabel = 'Investor',
}: {
  token: string;
  roleLabel?: 'Investor' | 'Legal admin';
}) {
  const [reports, setReports] = React.useState<InvestorReportSummary[]>([]);
  const [acceptedReports, setAcceptedReports] = React.useState<InvestorReportSummary[]>([]);
  const [instrumentReports, setInstrumentReports] = React.useState<InvestorReportSummary[]>([]);
  const [settlements, setSettlements] = React.useState<InvestorLedgerSummary[]>([]);
  const [settlementRewards, setSettlementRewards] = React.useState<InvestorLedgerSummary[]>([]);
  const [paymentRewards, setPaymentRewards] = React.useState<InvestorLedgerSummary[]>([]);
  const [rewardPayments, setRewardPayments] = React.useState<InvestorLedgerSummary[]>([]);
  const [closedContracts, setClosedContracts] = React.useState<InvestorLedgerSummary[]>([]);
  const [selectedInstrumentId, setSelectedInstrumentId] = React.useState('');
  const [instruments, setInstruments] = React.useState<InstrumentOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const mapReport = (event: { contractId: string; createArguments?: Record<string, unknown> }) => {
    const args = getDamlCreateArguments<{
      instrumentId?: unknown;
      periodLabel?: unknown;
      reportHash?: unknown;
    }>({ contractId: String(event.contractId), createArguments: event.createArguments });
    return {
      contractId: String(event.contractId),
      instrumentId: toStringValue(args.instrumentId, ''),
      periodLabel: toStringValue(args.periodLabel, ''),
      reportHash: toStringValue(args.reportHash, ''),
    };
  };

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        instrumentResponse,
        reportResponse,
        acceptedResponse,
        settlementResponse,
        settlementRewardResponse,
        paymentRewardResponse,
        rewardPaymentResponse,
        closedResponse,
      ] = await Promise.all([
        getInstruments(token),
        getReports(token),
        getAcceptedReports(token),
        getSettlements(token),
        getRewardRecords(token),
        getPaymentRewards(token),
        getRewardPaymentConfirmations(token),
        getClosedContracts(token),
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
      const byInstrument = effectiveInstrumentId
        ? await getReportsByInstrument(token, effectiveInstrumentId).catch(() => [])
        : [];

      setInstruments(normalizedInstruments as InstrumentOption[]);
      setSelectedInstrumentId(effectiveInstrumentId);
      setReports(reportResponse.map(mapReport).filter((item) => item.instrumentId));
      setAcceptedReports(acceptedResponse.map(mapReport).filter((item) => item.instrumentId));
      setInstrumentReports(byInstrument.map(mapReport).filter((item) => item.instrumentId));

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

      const mapReward = (event: { contractId: string; createArguments?: Record<string, unknown> }) => {
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
      };

      setSettlementRewards(settlementRewardResponse.map(mapReward).filter((item) => item.instrumentId));
      setPaymentRewards(paymentRewardResponse.map(mapReward).filter((item) => item.instrumentId));
      setRewardPayments(
        rewardPaymentResponse.map((event) => {
          const args = getDamlCreateArguments<{
            instrumentId?: unknown;
            rewardAmount?: unknown;
            status?: unknown;
          }>({ contractId: String(event.contractId), createArguments: event.createArguments });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            amount: toNumber(args.rewardAmount),
            status: toStringValue(args.status, 'REWARD_PAID'),
          };
        }).filter((item) => item.instrumentId)
      );
      setClosedContracts(
        closedResponse.map((event) => {
          const args = getDamlCreateArguments<{ instrumentId?: unknown; status?: unknown }>({
            contractId: String(event.contractId),
            createArguments: event.createArguments,
          });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            amount: 0,
            status: toStringValue(args.status, 'CLOSED'),
          };
        }).filter((item) => item.instrumentId)
      );
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
        title={`${roleLabel} reporting`}
        description="Read performance reports, settlements, closed contracts, and reward payment records visible to your party."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{reports.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{acceptedReports.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rewards</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{formatCurrency([...settlementRewards, ...paymentRewards].reduce((sum, item) => sum + item.amount, 0))}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{formatCurrency(rewardPayments.reduce((sum, item) => sum + item.amount, 0))}</span></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Reports by instrument</CardTitle>
            <CardDescription>Uses `/reports/instrument/:instrumentId` for the selected instrument.</CardDescription>
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
            {instrumentReports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">No report for selected instrument.</div>
            ) : (
              instrumentReports.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <p className="font-medium">{item.instrumentId}</p>
                  <p className="text-sm text-muted-foreground">{item.periodLabel} - {item.reportHash}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Settlement records</CardTitle>
            <CardDescription>Final reconciliation, reward records, confirmations, and closure.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[...settlements, ...settlementRewards, ...paymentRewards, ...rewardPayments, ...closedContracts].length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground sm:col-span-2">No settlement record yet.</div>
            ) : (
              [...settlements, ...settlementRewards, ...paymentRewards, ...rewardPayments, ...closedContracts].map((item) => (
                <div key={`${item.contractId}-${item.status}`} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.instrumentId}</p>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  {item.amount > 0 && <p className="mt-3 text-sm font-semibold text-success">{formatCurrency(item.amount)}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AuditorReportsWorkspace({ token }: { token: string }) {
  const [reports, setReports] = React.useState<InvestorReportSummary[]>([]);
  const [acceptedReports, setAcceptedReports] = React.useState<InvestorReportSummary[]>([]);
  const [instrumentReports, setInstrumentReports] = React.useState<InvestorReportSummary[]>([]);
  const [settlements, setSettlements] = React.useState<InvestorLedgerSummary[]>([]);
  const [rewards, setRewards] = React.useState<InvestorLedgerSummary[]>([]);
  const [closedContracts, setClosedContracts] = React.useState<InvestorLedgerSummary[]>([]);
  const [instruments, setInstruments] = React.useState<InstrumentOption[]>([]);
  const [selectedInstrumentId, setSelectedInstrumentId] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [accepting, setAccepting] = React.useState<string | null>(null);
  const [selectedReport, setSelectedReport] = React.useState<InvestorReportSummary | null>(null);

  const mapReport = (event: { contractId: string; createArguments?: Record<string, unknown> }) => {
    const args = getDamlCreateArguments<{
      instrumentId?: unknown;
      periodLabel?: unknown;
      reportHash?: unknown;
    }>({ contractId: String(event.contractId), createArguments: event.createArguments });
    return {
      contractId: String(event.contractId),
      instrumentId: toStringValue(args.instrumentId, ''),
      periodLabel: toStringValue(args.periodLabel, ''),
      reportHash: toStringValue(args.reportHash, ''),
    };
  };

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [instrumentResponse, reportResponse, acceptedResponse, settlementResponse, rewardResponse, closedResponse] =
        await Promise.all([
          getInstruments(token),
          getReports(token),
          getAcceptedReports(token),
          getSettlements(token),
          getRewardRecords(token),
          getClosedContracts(token),
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
      const byInstrument = effectiveInstrumentId
        ? await getReportsByInstrument(token, effectiveInstrumentId).catch(() => [])
        : [];

      setInstruments(normalizedInstruments as InstrumentOption[]);
      setSelectedInstrumentId(effectiveInstrumentId);
      setReports(reportResponse.map(mapReport).filter((item) => item.instrumentId));
      setAcceptedReports(acceptedResponse.map(mapReport).filter((item) => item.instrumentId));
      setInstrumentReports(byInstrument.map(mapReport).filter((item) => item.instrumentId));
      setSettlements(
        settlementResponse.map((event) => {
          const args = getDamlCreateArguments<{ instrumentId?: unknown; investorRewardPool?: unknown; status?: unknown }>({
            contractId: String(event.contractId),
            createArguments: event.createArguments,
          });
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
          const args = getDamlCreateArguments<{ instrumentId?: unknown; rewardAmount?: unknown; status?: unknown }>({
            contractId: String(event.contractId),
            createArguments: event.createArguments,
          });
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
          const args = getDamlCreateArguments<{ instrumentId?: unknown; status?: unknown }>({
            contractId: String(event.contractId),
            createArguments: event.createArguments,
          });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            amount: 0,
            status: toStringValue(args.status, 'CLOSED'),
          };
        }).filter((item) => item.instrumentId)
      );
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

  const handleAcceptReport = async (reportCid: string) => {
    setAccepting(reportCid);
    try {
      await acceptReport(token, reportCid);
      toast.success('Report accepted');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to accept report');
    } finally {
      setAccepting(null);
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
        title="Auditor reporting"
        description="Review performance reports, accept them, and inspect reconciliation records."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{reports.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{acceptedReports.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Settlements</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{settlements.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{closedContracts.length}</span></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Reports awaiting audit</CardTitle>
            <CardDescription>Accept a report by its Daml contract ID.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">No performance report visible.</div>
            ) : (
              reports.map((item) => (
                <div key={item.contractId} role="button" tabIndex={0} onClick={() => setSelectedReport(item)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedReport(item); }} className="cursor-pointer rounded-xl border border-border/60 bg-background/60 p-4 transition hover:border-primary/40 hover:shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{item.instrumentId}</p>
                      <p className="truncate text-sm text-muted-foreground">{item.periodLabel} - {item.reportHash}</p>
                    </div>
                    <Button size="sm" className="gap-2" onClick={(event) => { event.stopPropagation(); void handleAcceptReport(item.contractId); }} disabled={accepting === item.contractId}>
                      {accepting === item.contractId ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                      Accept
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Reports by instrument</CardTitle>
            <CardDescription>Uses `/reports/instrument/:instrumentId`.</CardDescription>
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
            {instrumentReports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">No report for selected instrument.</div>
            ) : (
              instrumentReports.map((item) => (
                <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <p className="font-medium">{item.instrumentId}</p>
                  <p className="text-sm text-muted-foreground">{item.periodLabel}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Accepted reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {acceptedReports.length === 0 ? <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No accepted report yet.</div> : acceptedReports.map((item) => (
              <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4"><p className="font-medium">{item.instrumentId}</p><p className="text-sm text-muted-foreground">{item.periodLabel}</p></div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Settlements and rewards</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[...settlements, ...rewards].length === 0 ? <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No settlement record visible.</div> : [...settlements, ...rewards].map((item) => (
              <div key={`${item.contractId}-${item.status}`} className="rounded-xl border border-border/60 bg-background/60 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium">{item.instrumentId}</p><Badge variant="outline">{item.status}</Badge></div>{item.amount > 0 && <p className="mt-2 text-sm">{formatCurrency(item.amount)}</p>}</div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Closed contracts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {closedContracts.length === 0 ? <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">No closed contract visible.</div> : closedContracts.map((item) => (
              <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4"><p className="font-medium">{item.instrumentId}</p><p className="text-sm text-muted-foreground">{item.status}</p></div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedReport)} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="sm:max-w-xl">
          {selectedReport && <>
            <DialogHeader>
              <DialogTitle>Performance report details</DialogTitle>
              <DialogDescription>Review the report information before accepting it.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Instrument', selectedReport.instrumentId],
                ['Period', selectedReport.periodLabel],
                ['Report hash', selectedReport.reportHash],
                ['Daml contract ID', selectedReport.contractId],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-border/70 bg-muted/20 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 break-all text-sm font-medium">{value || 'Not provided'}</p></div>)}
            </div>
            <Button className="w-full gap-2" onClick={() => { void handleAcceptReport(selectedReport.contractId); setSelectedReport(null); }} disabled={accepting === selectedReport.contractId}>{accepting === selectedReport.contractId && <Loader2 className="h-4 w-4 animate-spin" />}{accepting === selectedReport.contractId ? 'Accepting...' : 'Accept report'}</Button>
          </>}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PaymentVerifierReportsWorkspace({ token }: { token: string }) {
  const [reports, setReports] = React.useState<InvestorReportSummary[]>([]);
  const [acceptedReports, setAcceptedReports] = React.useState<InvestorReportSummary[]>([]);
  const [settlements, setSettlements] = React.useState<InvestorLedgerSummary[]>([]);
  const [rewards, setRewards] = React.useState<InvestorLedgerSummary[]>([]);
  const [rewardPayments, setRewardPayments] = React.useState<InvestorLedgerSummary[]>([]);
  const [closedContracts, setClosedContracts] = React.useState<InvestorLedgerSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const mapReport = (event: { contractId: string; createArguments?: Record<string, unknown> }) => {
    const args = getDamlCreateArguments<{
      instrumentId?: unknown;
      periodLabel?: unknown;
      reportHash?: unknown;
    }>({ contractId: String(event.contractId), createArguments: event.createArguments });
    return {
      contractId: String(event.contractId),
      instrumentId: toStringValue(args.instrumentId, ''),
      periodLabel: toStringValue(args.periodLabel, ''),
      reportHash: toStringValue(args.reportHash, ''),
    };
  };

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [reportResponse, acceptedResponse, settlementResponse, rewardResponse, rewardPaymentResponse, closedResponse] =
        await Promise.all([
          getReports(token),
          getAcceptedReports(token),
          getSettlements(token),
          getRewardRecords(token),
          getRewardPaymentConfirmations(token),
          getClosedContracts(token),
        ]);

      setReports(reportResponse.map(mapReport).filter((item) => item.instrumentId));
      setAcceptedReports(acceptedResponse.map(mapReport).filter((item) => item.instrumentId));
      setSettlements(
        settlementResponse.map((event) => {
          const args = getDamlCreateArguments<{ instrumentId?: unknown; investorRewardPool?: unknown; status?: unknown }>({
            contractId: String(event.contractId),
            createArguments: event.createArguments,
          });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            amount: toNumber(args.investorRewardPool),
            status: toStringValue(args.status, 'RECONCILED'),
          };
        }).filter((item) => item.instrumentId)
      );
      const mapReward = (event: { contractId: string; createArguments?: Record<string, unknown> }) => {
        const args = getDamlCreateArguments<{ instrumentId?: unknown; rewardAmount?: unknown; status?: unknown }>({
          contractId: String(event.contractId),
          createArguments: event.createArguments,
        });
        return {
          contractId: String(event.contractId),
          instrumentId: toStringValue(args.instrumentId, ''),
          amount: toNumber(args.rewardAmount),
          status: toStringValue(args.status, 'PAYMENT_PENDING'),
        };
      };
      setRewards(rewardResponse.map(mapReward).filter((item) => item.instrumentId));
      setRewardPayments(rewardPaymentResponse.map(mapReward).filter((item) => item.instrumentId));
      setClosedContracts(
        closedResponse.map((event) => {
          const args = getDamlCreateArguments<{ instrumentId?: unknown; status?: unknown }>({
            contractId: String(event.contractId),
            createArguments: event.createArguments,
          });
          return {
            contractId: String(event.contractId),
            instrumentId: toStringValue(args.instrumentId, ''),
            amount: 0,
            status: toStringValue(args.status, 'CLOSED'),
          };
        }).filter((item) => item.instrumentId)
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
        title="Payment reporting"
        description="Review reports, settlement records, reward records, and payment confirmations visible to payment verification."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{reports.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Settlements</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{settlements.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rewards</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{rewards.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Paid rewards</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{rewardPayments.length}</span></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Reward records</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[...rewards, ...rewardPayments].length === 0 ? <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">No reward record visible.</div> : [...rewards, ...rewardPayments].map((item) => (
              <div key={`${item.contractId}-${item.status}`} className="rounded-xl border border-border/60 bg-background/60 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium">{item.instrumentId}</p><Badge variant="outline">{item.status}</Badge></div>{item.amount > 0 && <p className="mt-2 text-sm">{formatCurrency(item.amount)}</p>}</div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Settlement visibility</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[...settlements, ...closedContracts].length === 0 ? <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">No settlement record visible.</div> : [...settlements, ...closedContracts].map((item) => (
              <div key={`${item.contractId}-${item.status}`} className="rounded-xl border border-border/60 bg-background/60 p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium">{item.instrumentId}</p><Badge variant="outline">{item.status}</Badge></div></div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border/70">
        <CardHeader><CardTitle className="text-base font-semibold">Reports visible to payment verifier</CardTitle><CardDescription>These may be empty if the Daml template does not observe the payment verifier.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {[...reports, ...acceptedReports].length === 0 ? <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground lg:col-span-2">No report visible.</div> : [...reports, ...acceptedReports].map((item) => (
            <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4"><p className="font-medium">{item.instrumentId}</p><p className="text-sm text-muted-foreground">{item.periodLabel} - {item.reportHash}</p></div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function AdminReportsWorkspace({ token }: { token: string }) {
  const [readerParty, setReaderParty] = React.useState<string>(localDamlParties.easycoin);
  const [instrumentId, setInstrumentId] = React.useState('INSTR-MPC-001');
  const [reports, setReports] = React.useState<InvestorReportSummary[]>([]);
  const [acceptedReports, setAcceptedReports] = React.useState<InvestorReportSummary[]>([]);
  const [instrumentReports, setInstrumentReports] = React.useState<InvestorReportSummary[]>([]);
  const [settlements, setSettlements] = React.useState<InvestorLedgerSummary[]>([]);
  const [rewards, setRewards] = React.useState<InvestorLedgerSummary[]>([]);
  const [paymentRewards, setPaymentRewards] = React.useState<InvestorLedgerSummary[]>([]);
  const [rewardPayments, setRewardPayments] = React.useState<InvestorLedgerSummary[]>([]);
  const [closedContracts, setClosedContracts] = React.useState<InvestorLedgerSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const mapReport = React.useCallback((event: { contractId: string; createArguments?: Record<string, unknown> }) => {
    const args = getDamlCreateArguments<{
      instrumentId?: unknown;
      periodLabel?: unknown;
      reportHash?: unknown;
    }>({ contractId: String(event.contractId), createArguments: event.createArguments });
    return {
      contractId: String(event.contractId),
      instrumentId: toStringValue(args.instrumentId, ''),
      periodLabel: toStringValue(args.periodLabel, ''),
      reportHash: toStringValue(args.reportHash, ''),
    };
  }, []);

  const mapLedger = React.useCallback((event: { contractId: string; createArguments?: Record<string, unknown> }) => {
    const args = getDamlCreateArguments<{
      instrumentId?: unknown;
      investorRewardPool?: unknown;
      rewardAmount?: unknown;
      status?: unknown;
    }>({ contractId: String(event.contractId), createArguments: event.createArguments });
    return {
      contractId: String(event.contractId),
      instrumentId: toStringValue(args.instrumentId, ''),
      amount: toNumber(args.investorRewardPool ?? args.rewardAmount),
      status: toStringValue(args.status, 'Visible'),
    };
  }, []);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        reportResponse,
        acceptedResponse,
        byInstrumentResponse,
        settlementResponse,
        rewardResponse,
        paymentRewardResponse,
        rewardPaymentResponse,
        closedResponse,
      ] = await Promise.all([
        getReports(token, readerParty),
        getAcceptedReports(token, readerParty),
        instrumentId.trim() ? getReportsByInstrument(token, instrumentId.trim(), readerParty).catch(() => []) : Promise.resolve([]),
        getSettlements(token, readerParty),
        getRewardRecords(token, readerParty),
        getPaymentRewards(token, readerParty),
        getRewardPaymentConfirmations(token, readerParty),
        getClosedContracts(token, readerParty),
      ]);

      setReports(reportResponse.map(mapReport).filter((item) => item.instrumentId));
      setAcceptedReports(acceptedResponse.map(mapReport).filter((item) => item.instrumentId));
      setInstrumentReports(byInstrumentResponse.map(mapReport).filter((item) => item.instrumentId));
      setSettlements(settlementResponse.map(mapLedger).filter((item) => item.instrumentId));
      setRewards(rewardResponse.map(mapLedger).filter((item) => item.instrumentId));
      setPaymentRewards(paymentRewardResponse.map(mapLedger).filter((item) => item.instrumentId));
      setRewardPayments(rewardPaymentResponse.map(mapLedger).filter((item) => item.instrumentId));
      setClosedContracts(closedResponse.map(mapLedger).filter((item) => item.instrumentId));
    } finally {
      setLoading(false);
    }
  }, [instrumentId, mapLedger, mapReport, readerParty, token]);

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

  const renderReports = (items: InvestorReportSummary[], empty: string) =>
    items.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">{empty}</div>
    ) : (
      items.map((item) => (
        <div key={item.contractId} className="rounded-xl border border-border/60 bg-background/60 p-4">
          <p className="font-medium">{item.instrumentId}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.periodLabel} - {item.reportHash}</p>
        </div>
      ))
    );

  const renderLedger = (items: InvestorLedgerSummary[], empty: string) =>
    items.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">{empty}</div>
    ) : (
      items.map((item) => (
        <div key={`${item.contractId}-${item.status}`} className="rounded-xl border border-border/60 bg-background/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{item.instrumentId}</p>
            <Badge variant="outline">{item.status}</Badge>
          </div>
          {item.amount > 0 && <p className="mt-2 text-sm">{formatCurrency(item.amount)}</p>}
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
        title="Admin reporting console"
        description="Read Admin-authorized reporting, settlement, reward, and payment records by selected Daml party."
      >
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Admin reader controls</CardTitle>
          <CardDescription>Use a real Daml party for ledger reads. Instrument lookup uses `/reports/instrument/:instrumentId`.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[1fr_0.7fr]">
          <Select value={readerParty} onValueChange={setReaderParty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {adminReaderParties.map((party) => (
                <SelectItem key={party.value} value={party.value}>{party.label} - {party.value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={instrumentId} onChange={(event) => setInstrumentId(event.target.value)} placeholder="INSTR-MPC-001" />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{reports.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{acceptedReports.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Settlements</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{settlements.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Payments</CardTitle></CardHeader><CardContent><span className="text-2xl font-semibold">{paymentRewards.length + rewardPayments.length}</span></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">{renderReports([...reports, ...acceptedReports], 'No report visible for this party.')}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Reports by instrument</CardTitle></CardHeader>
          <CardContent className="space-y-3">{renderReports(instrumentReports, 'No report visible for this instrument and party.')}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Settlement and closure</CardTitle></CardHeader>
          <CardContent className="space-y-3">{renderLedger([...settlements, ...closedContracts], 'No settlement record visible for this party.')}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader><CardTitle className="text-base font-semibold">Rewards and payments</CardTitle></CardHeader>
          <CardContent className="space-y-3">{renderLedger([...rewards, ...paymentRewards, ...rewardPayments], 'No reward or payment record visible for this party.')}</CardContent>
        </Card>
      </div>
    </>
  );
}

export default function ReportsPage() {
  const { session } = useSession();

  if (session.role === 'EASYCOIN') {
    return <EasycoinReportsWorkspace token={session.accessToken} />;
  }

  if (session.role === 'INVESTOR') {
    return <InvestorReportsWorkspace token={session.accessToken} />;
  }

  if (session.role === 'LEGAL_ADMIN') {
    return <InvestorReportsWorkspace token={session.accessToken} roleLabel="Legal admin" />;
  }

  if (session.role === 'AUDITOR') {
    return <AuditorReportsWorkspace token={session.accessToken} />;
  }

  if (session.role === 'PAYMENT_VERIFIER') {
    return <PaymentVerifierReportsWorkspace token={session.accessToken} />;
  }

  if (session.role === 'ADMIN') {
    return <AdminReportsWorkspace token={session.accessToken} />;
  }

  return (
    <>
      <PageHeader
        title="Performance & settlement"
        description="Track reports, reconciliation, reward creation, payment confirmation, and token burn."
      >
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarRange className="h-4 w-4" />
          Financial period
        </Button>
        <Button size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Create final report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label} className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold tracking-tight">
                {formatCurrency(stat.value)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Financial period overview"
          description="Provisional income and expense trajectory for the managed property."
        >
          <RevenueChart />
        </ChartCard>
        <ChartCard
          title="Final allocation"
          description="How the distributable profit is split at settlement."
        >
          <PortfolioChart />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Settlement timeline</CardTitle>
            <CardDescription>
              The POC separates provisional reporting from the final ledger state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{step.title}</h3>
                    <Badge variant="outline">{step.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </div>
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Final records</CardTitle>
            <CardDescription>Key artifacts that should exist at close.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Report hash
              </p>
              <p className="mt-2 text-sm font-medium">HASH-FINAL-REPORT-001</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Reconciliation CID
              </p>
              <p className="mt-2 text-sm font-medium">REC-2026-Q3</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Closed contract
              </p>
              <p className="mt-2 text-sm font-medium">MPC-001</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Burn record
              </p>
              <p className="mt-2 text-sm font-medium">BURN-INSTR-MPC-001</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
