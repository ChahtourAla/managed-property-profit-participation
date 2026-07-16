import type { ReactNode } from 'react';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CircleDollarSign,
  Coins,
  CreditCard,
  FileBarChart2,
  Landmark,
  LockKeyhole,
  PieChart,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Waves,
} from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const trustedBy = ['Property firms', 'FinTech teams', 'Private capital', 'Asset managers', 'Operations leads'];

const steps = [
  {
    step: '01',
    icon: Building2,
    title: 'Property owner creates a managed contract',
    text: 'A managed property contract defines the asset, the expected rental profit, and the participation terms.',
  },
  {
    step: '02',
    icon: Coins,
    title: 'Investors fund future profits',
    text: 'Investors subscribe to tokenized profit participation and provide upfront liquidity against future returns.',
  },
  {
    step: '03',
    icon: BarChart3,
    title: 'Everyone tracks performance and receives settlements',
    text: 'Easycoin tracks performance, reporting, and settlement events from onboarding to final distribution.',
  },
];

const ownerBenefits = ['Receive upfront liquidity', 'Keep property ownership', 'Transparent reporting'];
const investorBenefits = ['Invest in managed property profits', 'Track performance', 'Receive rewards'];
const easycoinBenefits = ['Property management', 'Financial reporting', 'Secure settlement'];

const features = [
  {
    icon: Coins,
    title: 'Tokenized Profit Participation',
    text: 'Structured participation in future managed property profits, designed for clarity and traceability.',
  },
  {
    icon: Landmark,
    title: 'Enterprise Workflow',
    text: 'Role-based screens and lifecycle controls for property owners, investors, and operations teams.',
  },
  {
    icon: Shield,
    title: 'Secure Ledger',
    text: 'Private recordkeeping for contract validation, holdings, and settlement history.',
  },
  {
    icon: Users,
    title: 'Investor Dashboard',
    text: 'A focused space for funding status, expected rewards, and participation overview.',
  },
  {
    icon: Building2,
    title: 'Property Analytics',
    text: 'Metrics for revenue, expenses, performance, and asset health in one place.',
  },
  {
    icon: FileBarChart2,
    title: 'Performance Reports',
    text: 'Clear reporting for reconciliation, payouts, and lifecycle milestones.',
  },
  {
    icon: CircleDollarSign,
    title: 'Financial Transparency',
    text: 'Straightforward ownership, settlement logic, and reporting for every role.',
  },
  {
    icon: Waves,
    title: 'Settlement Automation',
    text: 'Settlement flows are driven by contract milestones and validated financial outcomes.',
  },
];

const stats = [
  { label: 'Properties Managed', value: '128', delta: '+18%' },
  { label: 'Investors', value: '2.4K', delta: '+32%' },
  { label: 'Funds Raised', value: '$4.2M', delta: '+26%' },
  { label: 'Rewards Distributed', value: '$1.7M', delta: '+21%' },
  { label: 'Success Rate', value: '99.2%', delta: '+0.8%' },
];

const testimonials = [
  {
    quote:
      'Easycoin makes the workflow understandable for property owners and clean enough for investor reporting.',
    name: 'Youssef B.',
    role: 'Property Owner',
  },
  {
    quote:
      'The transparency around performance and settlement gives us a much stronger product story than a generic investment portal.',
    name: 'Sarah M.',
    role: 'Investor',
  },
  {
    quote:
      'The role-based experience and reporting structure feel enterprise-grade and ready for production.',
    name: 'Omar L.',
    role: 'Operations Lead',
  },
];

const faqItems = [
  {
    question: 'What does Easycoin tokenize?',
    answer:
      'Easycoin tokenizes a participation right in future managed property profits, not the property itself.',
  },
  {
    question: 'Does the property owner keep ownership?',
    answer:
      'Yes. The owner keeps the property while unlocking upfront liquidity against future rental profits.',
  },
  {
    question: 'How are settlements handled?',
    answer:
      'Settlements are calculated from the managed contract, performance data, and reconciliation rules defined in the workflow.',
  },
  {
    question: 'Who can access the platform?',
    answer:
      'The experience is role-based for owners, investors, Easycoin operators, auditors, payment verifiers, and legal admins.',
  },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Badge variant="outline" className="rounded-full border-border/70 bg-background px-3 py-1 text-primary">
      {children}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <Card className="border-border/70 bg-card/85 shadow-[0_16px_50px_-34px_rgba(15,23,42,0.22)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {delta}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-background" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 mb-8 rounded-[1.5rem] border border-border/70 bg-card/85 px-4 py-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.28)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-semibold tracking-tight">Easycoin</div>
                <div className="text-xs text-muted-foreground">FinTech for managed property profits</div>
              </div>
            </Link>

            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
              {['Product', 'How it works', 'Features', 'Security', 'FAQ'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="rounded-full px-4 py-2 hover:bg-accent/70 hover:text-accent-foreground"
                >
                  {item}
                </a>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-xs">
                Light mode
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Contact sales</Link>
              </Button>
              <Button size="sm" asChild className="gap-2">
                <Link href="/dashboard">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <section id="product" className="grid gap-10 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-16">
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <SectionLabel>Managed property profits</SectionLabel>
              <SectionLabel>Role-based finance workflow</SectionLabel>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.94] tracking-tight text-balance sm:text-6xl lg:text-[4.9rem]">
                Premium liquidity for managed property profits.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Easycoin helps property owners unlock upfront liquidity from a managed contract
                while investors participate in future rental profits through a private,
                role-based workflow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link href="/dashboard">
                  Start Investing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Become a Property Owner</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Owner retains the property
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Investors fund future profits
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <LockKeyhole className="h-4 w-4 text-success" />
                  Settlement stays auditable
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <Card className="relative overflow-hidden border-border/70 bg-card/85 shadow-[0_28px_90px_-40px_rgba(15,23,42,0.38)]">
              <div className="h-1 bg-primary" />
              <CardContent className="space-y-5 p-6 sm:p-7">
                <div className="rounded-[1.6rem] border border-border/70 bg-background/60 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Contract overview
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                        Managed property participation
                      </p>
                    </div>
                    <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Active
                    </Badge>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Upfront liquidity</span>
                      <span className="font-semibold text-foreground">8,200 USDC</span>
                    </div>
                    <Progress value={72} className="h-2.5 bg-secondary" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Investor funding</span>
                      <span className="font-medium text-foreground">72%</span>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[1.25rem] border border-border/70 bg-card p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Settlement
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          Final reconciliation
                        </p>
                      </div>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                        2,400 USDC
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Profit split after the managed property period closes.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-card p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Owner
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">Keeps the property</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Investor
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">Funds future profit</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Settlement
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">Final reconciliation</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-8">
          <div className="rounded-[1.75rem] border border-border/70 bg-card/85 p-5 shadow-[0_18px_60px_-45px_rgba(15,23,42,0.26)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trusted by</p>
              <p className="text-sm text-muted-foreground">Property teams, investors, and finance operators</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {trustedBy.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/55 px-4 py-5 text-sm font-medium text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="grid gap-8 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-4">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              A simple three-step workflow for managed property profits.
            </h2>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Easycoin keeps the experience intentionally narrow so owners, investors, and operators
              can understand the financial flow in seconds.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((item, index) => (
              <Card key={item.step} className="border-border/70 bg-card/85 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.28)]">
                <CardContent className="p-5 sm:p-6">
                  <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                          {item.step}
                        </span>
                        <p className="text-base font-semibold text-foreground">{item.title}</p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
                      <div className="flex items-center gap-2 text-xs font-medium text-success">
                        <Check className="h-3.5 w-3.5" />
                        Step {index + 1} of 3
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-10 lg:grid-cols-3">
          <Card className="border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="text-2xl">For Property Owners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ownerBenefits.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-background/60 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="text-2xl">For Investors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {investorBenefits.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-background/60 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="text-2xl">For Easycoin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {easycoinBenefits.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-background/60 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="py-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-4">
              <SectionLabel>Interactive dashboard preview</SectionLabel>
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                A premium dashboard preview that feels production-ready.
              </h2>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Show the revenue analytics, investment holdings, performance reports, and settlement
                visibility in a single polished surface.
              </p>
            </div>

            <Card className="overflow-hidden border-border/70 bg-card/85 shadow-[0_24px_80px_-54px_rgba(15,23,42,0.34)]">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Dashboard preview
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">Financial overview</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                    Live
                  </Badge>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Revenue analytics</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">$128K</p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <div className="mt-4 flex items-end gap-2">
                      {[40, 68, 52, 84, 74, 92, 60].map((height, index) => (
                        <div key={index} className="flex-1 rounded-t-xl bg-primary/10">
                          <div className="rounded-t-xl bg-primary" style={{ height: `${height}px` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Profit chart</p>
                        <p className="mt-1 text-xl font-semibold text-foreground">18.4%</p>
                      </div>
                      <PieChart className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-4 h-36 rounded-2xl border border-border/70 bg-card p-3">
                      <div className="flex h-full items-end gap-3">
                        {[22, 34, 28, 48, 56, 42, 68].map((height, index) => (
                          <div key={index} className="flex-1 rounded-full bg-secondary">
                            <div className="rounded-full bg-success" style={{ height: `${height}px` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Card className="border-border/70 bg-card">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Investment portfolio</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">42 active positions</p>
                      <Progress value={66} className="mt-3 h-2 bg-secondary" />
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-card">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Holdings</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">1.8M tokens</p>
                      <div className="mt-3 flex items-center gap-2 text-sm text-success">
                        <CircleDollarSign className="h-4 w-4" />
                        Stable participation structure
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="features" className="py-10">
          <div className="mb-6 space-y-3">
            <SectionLabel>Features</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Everything needed for a premium managed property finance product.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-border/70 bg-card/85 shadow-[0_18px_60px_-46px_rgba(15,23,42,0.28)]"
              >
                <CardContent className="p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="grid gap-4 lg:grid-cols-5">
            {stats.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section id="security" className="grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <SectionLabel>Security</SectionLabel>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Security, privacy, and auditability designed for enterprise trust.
            </h2>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              The experience should reassure financial teams that the product is structured, governed,
              and safe to use at scale.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: 'Enterprise Security',
                text: 'Built around secure access, trusted roles, and controlled operations.',
              },
              {
                icon: Landmark,
                title: 'Blockchain Ledger',
                text: 'Lifecycle events can be tracked across a private ledger environment.',
              },
              {
                icon: FileBarChart2,
                title: 'Audit Trail',
                text: 'Each contract milestone, report, and settlement remains traceable.',
              },
              {
                icon: LockKeyhole,
                title: 'Data Privacy',
                text: 'Sensitive workflow details remain behind role-based access boundaries.',
              },
              {
                icon: CreditCard,
                title: 'Secure Authentication',
                text: 'Users enter focused interfaces based on their assigned role.',
              },
            ].map((item) => (
              <Card key={item.title} className="border-border/70 bg-card/85">
                <CardContent className="p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="space-y-4">
            <SectionLabel>Testimonials</SectionLabel>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Premium feedback from the people this platform is designed for.
            </h2>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <Card key={item.name} className="border-border/70 bg-card/85">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-primary">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Sparkles key={index} className="h-4 w-4" />
                    ))}
                  </div>
                  <p className="mt-4 text-base leading-7 text-foreground">"{item.quote}"</p>
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Quick answers for property owners and investors.
            </h2>
          </div>

          <Card className="border-border/70 bg-card/85">
            <CardContent className="p-5 sm:p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={item.question} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-base font-medium text-foreground no-underline hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-7 text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <footer className="py-8 lg:py-12">
          <div className="rounded-[2rem] border border-border/70 bg-card/85 px-6 py-8 shadow-[0_20px_70px_-54px_rgba(15,23,42,0.28)] sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">Easycoin</p>
                    <p className="text-sm text-muted-foreground">FinTech for managed property profits</p>
                  </div>
                </div>
                <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                  A premium platform for property owners, investors, and enterprise operators building
                  transparent profit participation workflows.
                </p>
              </div>

              {[
                { title: 'Navigation', links: ['Home', 'Product', 'Features', 'FAQ'] },
                { title: 'Resources', links: ['Dashboard', 'Reports', 'Security', 'Support'] },
                { title: 'Legal', links: ['Terms', 'Privacy', 'Compliance'] },
              ].map((column) => (
                <div key={column.title} className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">{column.title}</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {column.links.map((link) => (
                      <li key={link}>{link}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Separator className="my-6 bg-border/80" />

            <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>(c) 2026 Easycoin. All rights reserved.</p>
              <p>Built for trust, transparency, and financial technology workflows.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
