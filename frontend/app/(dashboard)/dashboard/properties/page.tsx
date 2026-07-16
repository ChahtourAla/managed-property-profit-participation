'use client';

import { Building2, CheckCircle2, PencilLine, ShieldCheck, Signature, WalletCards } from 'lucide-react';

import { properties } from '@/lib/mock-properties';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const contract = properties[0];

const checkpoints = [
  {
    title: 'Draft submitted',
    description: 'Owner or Easycoin created the managed contract record.',
    icon: PencilLine,
    status: 'Draft',
  },
  {
    title: 'Owner confirmation',
    description: 'Required only when Easycoin submits the record on behalf of the owner.',
    icon: Signature,
    status: 'Owner confirmation pending',
  },
  {
    title: 'Easycoin validation',
    description: 'Easycoin/Admin checks business data, settlement assumptions, and token readiness.',
    icon: CheckCircle2,
    status: 'Validated',
  },
  {
    title: 'Token instrument',
    description: 'Canton instrument is created once the contract is validated.',
    icon: WalletCards,
    status: 'Token instrument created',
  },
];

export default function PropertiesPage() {
  return (
    <>
      <PageHeader
        title="Managed contract"
        description="The POC is intentionally narrow: one managed property, one owner, one financial period."
      >
        <Button variant="outline" size="sm" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Validate contract
        </Button>
        <Button size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          Open draft
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70">
          <CardHeader className="space-y-3 border-b border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {contract.id}
              </Badge>
              <StatusBadge status={contract.status} />
            </div>
            <div>
              <CardTitle className="text-xl">{contract.name}</CardTitle>
              <CardDescription>{contract.address}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Contract value
              </p>
              <p className="mt-2 text-lg font-semibold">{formatCurrency(contract.value)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Financial period
              </p>
              <p className="mt-2 text-lg font-semibold">2026</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Owner-side target
              </p>
              <p className="mt-2 text-lg font-semibold">{formatCurrency(76800)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Created on Canton
              </p>
              <p className="mt-2 text-lg font-semibold">{formatDate(contract.acquired)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Lifecycle checkpoints</CardTitle>
            <CardDescription>What happens before investors can subscribe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {checkpoints.map((step) => (
              <div
                key={step.title}
                className="flex items-start gap-3 rounded-xl border border-border/60 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <step.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium">{step.title}</h3>
                    <StatusBadge status={step.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
