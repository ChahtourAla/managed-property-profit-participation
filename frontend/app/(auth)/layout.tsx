import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, LineChart, Wallet } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-background" />
      <div className="landing-starfield pointer-events-none absolute -right-8 top-0 h-[56rem] w-[30rem] opacity-70" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex min-h-[5.5rem] items-center justify-between px-16 py-4 sm:px-24 lg:px-36">
          <Link href="/" aria-label="Menzel home" className="shrink-0">
            <BrandLogo className="origin-left scale-[1.2]" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center px-16 py-8 sm:px-24 lg:px-36 lg:py-10">
          <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
            <div className="space-y-6 lg:pr-8">
              <div className="inline-flex items-center rounded-full border border-[#C4A24E]/45 bg-[#C4A24E]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#A9822F]">
                Enterprise workflow surface
              </div>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  A premium command center for tokenized real-estate participation.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Menzel gives each role a dedicated workspace to validate contracts,
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
                  <Card key={item.title} className="border-[#D8D2C4] bg-[#FBFAF6]/90 shadow-[0_18px_45px_-32px_rgba(19,58,49,0.35)]">
                    <CardContent className="p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EEE9] text-[#B08A3A]">
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

        <footer className="px-16 py-6 text-center text-sm text-muted-foreground sm:px-24 lg:px-36">
          &copy; {new Date().getFullYear()} Menzel. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
