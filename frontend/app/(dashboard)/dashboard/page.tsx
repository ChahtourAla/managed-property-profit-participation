'use client';

import type { ElementType } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Coins,
  FileClock,
  Landmark,
  ScrollText,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';

import { stats } from '@/lib/mock-stats';
import { transactions } from '@/lib/mock-transactions';
import { properties } from '@/lib/mock-properties';
import { investments } from '@/lib/mock-investments';
import { formatCurrency, formatDate } from '@/lib/format';
import { roleProfiles } from '@/lib/role-config';
import { useSession } from '@/lib/session';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { ChartCard } from '@/components/dashboard/chart-card';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { PortfolioChart } from '@/components/charts/portfolio-chart';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const contract = properties[0];
const recentEvents = transactions.slice(0, 5);
const investorRows = investments.filter((item) => item.role === 'Investor');

const roleHighlights: Record<
  string,
  {
    label: string;
    value: string;
    icon: ElementType;
  }[]
> = {
  OWNER: [
    { label: 'Upfront liquidity', value: formatCurrency(34000), icon: Wallet },
    { label: 'Retained share', value: formatCurrency(38400), icon: BadgeCheck },
    { label: 'Contract status', value: contract.status, icon: Building2 },
  ],
  EASYCOIN: [
    { label: 'Validated contract', value: contract.id, icon: Building2 },
    { label: 'Open tasks', value: 'Draft, instrument, settlement', icon: FileClock },
    { label: 'Investor pool', value: `${investorRows.length} approved`, icon: Users },
  ],
  INVESTOR: [
    { label: 'Subscribed units', value: '700', icon: Coins },
    { label: 'Funding status', value: 'Funded', icon: Wallet },
    { label: 'Expected reward', value: formatCurrency(38400), icon: BadgeCheck },
  ],
  AUDITOR: [
    { label: 'Reports pending', value: '1', icon: ScrollText },
    { label: 'Final state', value: 'Reconciled', icon: BadgeCheck },
    { label: 'Closure state', value: 'Ready', icon: ShieldCheck },
  ],
  PAYMENT_VERIFIER: [
    { label: 'Funding checks', value: '1 pending', icon: Wallet },
    { label: 'Reward checks', value: '1 pending', icon: BadgeCheck },
    { label: 'Audit trace', value: 'Visible', icon: ScrollText },
  ],
  LEGAL_ADMIN: [
    { label: 'Owner confirmation', value: 'Required', icon: Landmark },
    { label: 'Investor approvals', value: 'Approved', icon: Users },
    { label: 'Compliance view', value: 'Read only', icon: ShieldCheck },
  ],
  ADMIN: [
    { label: 'Role access', value: 'All interfaces', icon: ShieldCheck },
    { label: 'Workflow health', value: 'Online', icon: BadgeCheck },
    { label: 'Demo state', value: 'Active', icon: FileClock },
  ],
};

const roleActionBlocks = {
  OWNER: [
    {
      title: 'Contract draft',
      description: 'Create or confirm the managed property case.',
      href: '/dashboard/properties',
      icon: Building2,
    },
    {
      title: 'Holdings and payout',
      description: 'See upfront liquidity and retained profit.',
      href: '/dashboard/holdings',
      icon: Wallet,
    },
  ],
  EASYCOIN: [
    {
      title: 'Validation and instrument',
      description: 'Validate the case and create the tokenized instrument.',
      href: '/dashboard/properties',
      icon: ShieldCheck,
    },
    {
      title: 'Settlement and rewards',
      description: 'Create reports, reconcile, and close the contract.',
      href: '/dashboard/reports',
      icon: BadgeCheck,
    },
  ],
  INVESTOR: [
    {
      title: 'Available instrument',
      description: 'Browse the profit participation opportunity.',
      href: '/dashboard/investments',
      icon: Coins,
    },
    {
      title: 'Reward outlook',
      description: 'Check the expected settlement amount.',
      href: '/dashboard/holdings',
      icon: Wallet,
    },
  ],
  AUDITOR: [
    {
      title: 'Reports to accept',
      description: 'Review performance and reconciliation data.',
      href: '/dashboard/reports',
      icon: ScrollText,
    },
    {
      title: 'Audit trail',
      description: 'Inspect the full lifecycle of the case.',
      href: '/dashboard/transactions',
      icon: ShieldCheck,
    },
  ],
  PAYMENT_VERIFIER: [
    {
      title: 'Funding confirmation',
      description: 'Confirm upfront investor funding.',
      href: '/dashboard/investments',
      icon: Wallet,
    },
    {
      title: 'Funding confirmation trail',
      description: 'Review confirmed funding events and lifecycle records.',
      href: '/dashboard/transactions',
      icon: BadgeCheck,
    },
  ],
  LEGAL_ADMIN: [
    {
      title: 'Contract and approvals',
      description: 'Review the managed contract and investor eligibility.',
      href: '/dashboard/properties',
      icon: Landmark,
    },
    {
      title: 'Controlled visibility',
      description: 'Open the legal audit trail.',
      href: '/dashboard/transactions',
      icon: ScrollText,
    },
  ],
  ADMIN: [
    {
      title: 'System overview',
      description: 'Move between every role interface.',
      href: '/dashboard',
      icon: Users,
    },
    {
      title: 'Workflow settings',
      description: 'Tune demo preferences and notifications.',
      href: '/dashboard/settings',
      icon: BadgeCheck,
    },
  ],
} as const;

export default function DashboardPage() {
  const { session } = useSession();
  const profile = roleProfiles[session.role];
  const highlights = roleHighlights[session.role];
  const actions = roleActionBlocks[session.role];

  const timeline =
    session.role === 'INVESTOR'
      ? investorRows.slice(1, 4)
      : recentEvents;

  return (
    <>
      <PageHeader title={profile.title} description={profile.summary}>
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href={profile.secondaryAction?.href ?? '/dashboard/transactions'}>
            <ArrowRight className="h-4 w-4" />
            {profile.secondaryAction?.label ?? 'Open trail'}
          </Link>
        </Button>
        <Button size="sm" className="gap-2" asChild>
          <Link href={profile.primaryAction.href}>
            <Wallet className="h-4 w-4" />
            {profile.primaryAction.label}
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70">
          <CardHeader className="space-y-4 border-b border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                {profile.badge}
              </Badge>
              <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                {session.partyId}
              </Badge>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-xl">{contract.name}</CardTitle>
                <CardDescription>
                  {contract.address} - {contract.id}
                </CardDescription>
              </div>
              <StatusBadge status={contract.status} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
                <p className="mt-2 text-lg font-semibold tracking-tight">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Role interface</CardTitle>
            <CardDescription>{profile.tagline}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-start gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium">{action.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {session.role !== 'ADMIN' && session.role !== 'INVESTOR' && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <ChartCard
            className="lg:col-span-2"
            title="Financial period tracking"
            description="Rental income and expense tracking for the managed property POC."
          >
            <RevenueChart />
          </ChartCard>
          <ChartCard
            title="Profit allocation"
            description="Owner-side distributable profit split at the end of the period."
          >
            <PortfolioChart />
          </ChartCard>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">
                {session.role === 'INVESTOR' ? 'My timeline' : 'Recent workflow events'}
              </CardTitle>
              <CardDescription>
                {session.role === 'INVESTOR'
                  ? 'Your participation and reward state.'
                  : 'Events recorded across the lifecycle.'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/transactions" className="gap-1.5">
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {timeline.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {session.role === 'INVESTOR' ? (
                      <Coins className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ScrollText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {'description' in item ? item.description : item.holder}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate('date' in item ? item.date : item.startDate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={'status' in item ? item.status : 'Funded'} />
                  <span className="text-sm text-muted-foreground">
                    {'amount' in item ? formatCurrency(item.amount) : formatCurrency(item.expectedReward)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Project snapshot</CardTitle>
            <CardDescription>Common values for the managed property POC.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Contract</p>
              <p className="mt-2 text-sm font-medium">{contract.id}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Financial period</p>
              <p className="mt-2 text-sm font-medium">2026</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected investor settlement</p>
              <p className="mt-2 text-sm font-medium">{formatCurrency(38400)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
