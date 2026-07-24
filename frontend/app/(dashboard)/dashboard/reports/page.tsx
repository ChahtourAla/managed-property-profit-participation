'use client';

import {
  BadgeCheck,
  CalendarRange,
  FileText,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  Lock,
} from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { ChartCard } from '@/components/dashboard/chart-card';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { PortfolioChart } from '@/components/charts/portfolio-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';

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

export default function ReportsPage() {
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
