'use client';

import * as React from 'react';
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

import { formatCurrency, formatDate } from '@/lib/format';
import { getDamlCreateArguments, getInstruments, getOwnerDrafts, getApprovedInvestors, getValidatedContracts, getSubscriptions, getSubscriptionFundingConfirmations, getHoldings, getReports, getAcceptedReports, getSettlements, getRewardRecords, getRewardPaymentConfirmations, getClosedContracts, toNumber, toStringValue } from '@/lib/platform-api';
import { roleProfiles, type AppRole } from '@/lib/role-config';
import { useSession } from '@/lib/session';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
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

type DashboardEvent = {
  contractId: string;
  createArguments?: Record<string, unknown>;
  createdAt?: string;
  templateId?: string;
};

type DashboardData = Record<string, DashboardEvent[]>;

const emptyDashboardData: DashboardData = {
  drafts: [], validated: [], approved: [], instruments: [], subscriptions: [],
  funding: [], holdings: [], reports: [], acceptedReports: [], settlements: [],
  rewards: [], rewardConfirmations: [], closed: [],
};

const safeLoad = async (load: Promise<DashboardEvent[]>) => {
  try { return await load; } catch { return []; }
};

const eventArgs = (event: DashboardEvent) => getDamlCreateArguments<Record<string, unknown>>(event as never);

const displayDashboardParty = (value: string) => value.split('::')[0] || value;

const displayWorkflowStatus = (value: string) => {
  const knownStatuses: Record<string, string> = {
    APPROVED_INVESTOR: 'Approved',
    SUBSCRIPTION_OPEN: 'Subscription open',
    VALIDATED_MANAGED_CONTRACT: 'Validated',
  };
  return knownStatuses[value] ?? value.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
};

async function loadDashboardData(token: string, role: AppRole): Promise<DashboardData> {
  const data = { ...emptyDashboardData };
  const load = (key: string, request: Promise<DashboardEvent[]>) => request.then((value) => { data[key] = value; });
  const common = [
    load('instruments', safeLoad(getInstruments(token))),
    load('subscriptions', safeLoad(getSubscriptions(token))),
    load('funding', safeLoad(getSubscriptionFundingConfirmations(token))),
    load('holdings', safeLoad(getHoldings(token))),
    load('reports', safeLoad(getReports(token))),
    load('acceptedReports', safeLoad(getAcceptedReports(token))),
    load('settlements', safeLoad(getSettlements(token))),
    load('rewards', safeLoad(getRewardRecords(token))),
    load('rewardConfirmations', safeLoad(getRewardPaymentConfirmations(token))),
    load('closed', safeLoad(getClosedContracts(token))),
  ];

  if (role === 'EASYCOIN' || role === 'OWNER' || role === 'AUDITOR' || role === 'LEGAL_ADMIN') {
    await Promise.all([
      ...common,
      load('drafts', safeLoad(getOwnerDrafts(token))),
      load('validated', safeLoad(getValidatedContracts(token))),
      load('approved', safeLoad(getApprovedInvestors(token))),
    ]);
  } else {
    await Promise.all(common);
  }

  return data;
}

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
  const actions = roleActionBlocks[session.role];
  const [data, setData] = React.useState<DashboardData>(emptyDashboardData);
  const [loading, setLoading] = React.useState(true);
  const [partyIdCopied, setPartyIdCopied] = React.useState(false);

  const handleCopyPartyId = async () => {
    await navigator.clipboard.writeText(session.partyId);
    setPartyIdCopied(true);
    window.setTimeout(() => setPartyIdCopied(false), 1600);
  };

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    void loadDashboardData(session.accessToken, session.role).then((nextData) => {
      if (active) {
        setData(nextData);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [session.accessToken, session.role]);

  const uniqueInvestors = new Set(
    data.approved.map((event) => toStringValue(eventArgs(event).investor)).filter(Boolean),
  ).size;
  const contractEvent = data.validated[0] ?? data.drafts[0] ?? data.instruments[0];
  const contractArgs = contractEvent ? eventArgs(contractEvent) : {};
  const contractData = (contractArgs.contractData as Record<string, unknown> | undefined) ?? contractArgs;
  const contractId = toStringValue(contractData.contractId, contractEvent?.contractId ?? 'No contract yet');
  const contractName = toStringValue(contractData.propertyName, 'Managed property');
  const contractAddress = toStringValue(contractData.propertyAddress ?? contractData.address, 'Address not available');
  const contractStatus = data.closed.length > 0 ? 'Closed' : data.settlements.length > 0 ? 'Reconciled' : data.instruments.length > 0 ? 'Token instrument created' : data.validated.length > 0 ? 'Validated' : data.drafts.length > 0 ? 'Draft' : 'No active contract';
  const upfrontTotal = data.subscriptions.reduce((sum, event) => sum + toNumber(eventArgs(event).upfrontAmount), 0);
  const rewardTotal = data.rewards.reduce((sum, event) => sum + toNumber(eventArgs(event).amount ?? eventArgs(event).rewardAmount), 0);
  const isInvestor = session.role === 'INVESTOR';
  const activeContractCount = isInvestor ? data.subscriptions.length : data.validated.length + data.drafts.length;
  const participantCount = isInvestor ? data.subscriptions.length : uniqueInvestors;
  const highlights = [
    { label: isInvestor ? 'My subscriptions' : 'Active contracts', value: String(activeContractCount), icon: Building2 },
    { label: 'Tokenized instruments', value: String(data.instruments.length), icon: Coins },
    { label: isInvestor ? 'My participation' : 'Approved investors', value: String(participantCount), icon: Users },
  ];
  const timeline = [...Object.values(data).flat()]
    .filter((event, index, events) => event.contractId && events.findIndex((candidate) => candidate.contractId === event.contractId) === index)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 5);
  const dynamicStats = [
    { id: 'contracts', label: isInvestor ? 'Available instruments' : 'Managed contracts', value: String(isInvestor ? data.instruments.length : activeContractCount), delta: 0, trend: 'up' as const, icon: 'building' as const },
    { id: 'investors', label: isInvestor ? 'My subscriptions' : 'Approved investors', value: String(participantCount), delta: 0, trend: 'up' as const, icon: 'users' as const },
    { id: 'funding', label: isInvestor ? 'My upfront funding' : 'Upfront funding', value: formatCurrency(upfrontTotal), delta: 0, trend: 'up' as const, icon: 'dollar' as const },
    { id: 'rewards', label: isInvestor ? 'Expected rewards' : 'Recorded rewards', value: formatCurrency(rewardTotal), delta: 0, trend: 'up' as const, icon: 'trending' as const },
  ];

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
        {dynamicStats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-2">
        <Card className="h-full w-full overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.035] via-background to-muted/20 shadow-sm">
          <CardHeader className="space-y-5 border-b border-border/60 bg-gradient-to-br from-primary/[0.04] to-background">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                {profile.badge}
              </Badge>
              <button
                type="button"
                onClick={handleCopyPartyId}
                className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium tracking-wider text-foreground transition-colors hover:bg-accent"
                title="Copy full party ID"
                aria-label="Copy full party ID"
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{partyIdCopied ? 'Copied' : `${session.partyId.slice(0, 15)}...`}</span>
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-2xl tracking-tight">{contractName}</CardTitle>
                <CardDescription>
                  {contractAddress} - {contractId}
                </CardDescription>
              </div>
              <StatusBadge status={contractStatus} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 pt-6 sm:grid-cols-3 sm:pt-7">
          {highlights.map((item) => (
              <div key={item.label} className="min-w-0 rounded-2xl border border-border/60 bg-background/70 p-4 transition-colors hover:border-primary/25 hover:bg-background">
                <div className="flex min-w-0 items-start gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="leading-4">{item.label}</span>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{loading ? 'Loading...' : item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="flex h-full w-full flex-col border-primary/15 bg-gradient-to-br from-background via-background to-primary/[0.035] shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl tracking-tight">Role interface</CardTitle>
            <CardDescription>{profile.tagline}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center gap-3 pt-2 sm:pt-3">
            {actions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group flex min-h-[82px] items-center gap-4 rounded-2xl border border-border/60 bg-background/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.035] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{action.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="min-w-0 border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">
                {session.role === 'INVESTOR' ? 'My timeline' : 'Recent workflow activity'}
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
            {timeline.length === 0 ? (
              <p className="px-2 py-6 text-sm text-muted-foreground">No backend events available.</p>
            ) : timeline.map((item) => {
              const args = eventArgs(item);
              const rawEventLabel = toStringValue(args.instrumentId ?? args.contractId ?? args.investor, 'Workflow event');
              const eventLabel = args.investor ? displayDashboardParty(rawEventLabel) : rawEventLabel;
              const eventStatus = displayWorkflowStatus(toStringValue(args.status, item.templateId?.split(':').pop() ?? 'Recorded'));
              const eventAmount = toNumber(args.amount ?? args.upfrontAmount ?? args.rewardAmount);
              return (
              <div
                key={item.contractId}
                className="flex flex-col items-start justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center"
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
                    <span className="truncate text-sm font-medium">{eventLabel}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.createdAt ? formatDate(item.createdAt) : 'Date unavailable'}
                    </span>
                  </div>
                </div>
                <div className="flex max-w-full flex-wrap items-center gap-3 sm:justify-end">
                  <StatusBadge status={eventStatus} />
                  {eventAmount > 0 && <span className="text-sm text-muted-foreground">{formatCurrency(eventAmount)}</span>}
                </div>
              </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Project snapshot</CardTitle>
            <CardDescription>Key information about the managed property project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 transition-colors hover:border-primary/25">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Contract</p>
              <p className="mt-2 break-all text-sm font-medium">{contractId}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 transition-colors hover:border-primary/25">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Activity</p>
              <p className="mt-2 text-sm font-medium">{data.reports.length + data.settlements.length} recorded events</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 transition-colors hover:border-primary/25">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected investor settlement</p>
              <p className="mt-2 text-sm font-medium">{formatCurrency(rewardTotal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
