import * as React from 'react';
import Link from 'next/link';
import { Landmark, ArrowLeft, Shield, Sparkles, LineChart, Wallet } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-background" />

      <div className="relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-6 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">EasyCoin</span>
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Managed property POC
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
            <div className="space-y-6 lg:pr-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Enterprise workflow surface
              </div>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  A premium command center for tokenized real-estate participation.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  EasyCoin gives each role a dedicated workspace to validate contracts,
                  confirm funding, review performance, and close settlement with a private
                  Canton-backed audit trail.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: Shield,
                    title: 'Controlled access',
                    text: 'Role-aware interfaces with explicit permissions.',
                  },
                  {
                    icon: LineChart,
                    title: 'Operational clarity',
                    text: 'Performance, reconciliation, and rewards in one view.',
                  },
                  {
                    icon: Wallet,
                    title: 'Settlement-first',
                    text: 'Upfront funding and final payout without monthly noise.',
                  },
                ].map((item) => (
                  <Card key={item.title} className="border-border/70 bg-card/80">
                    <CardContent className="p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.text}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-border/70 bg-card/85 p-3 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.45)]">
                {children}
              </div>
            </div>
          </div>
        </div>

        <footer className="px-6 py-6 text-center text-sm text-muted-foreground sm:px-8 lg:px-10">
          &copy; {new Date().getFullYear()} EasyCoin. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
