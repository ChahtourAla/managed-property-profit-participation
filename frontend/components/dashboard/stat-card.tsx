'use client';

import * as React from 'react';
import {
  DollarSign,
  Building2,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatPercent } from '@/lib/format';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const iconMap: Record<string, LucideIcon> = {
  dollar: DollarSign,
  building: Building2,
  trending: TrendingUp,
  users: Users,
};

export type StatCardProps = {
  label: string;
  value: string;
  delta: number;
  trend: 'up' | 'down';
  icon: 'dollar' | 'building' | 'trending' | 'users';
  series?: { label: string; value: number }[];
};

export function StatCard({
  label,
  value,
  delta,
  trend,
  icon,
  series,
}: StatCardProps) {
  const Icon = iconMap[icon];
  const isUp = trend === 'up';
  const max = series ? Math.max(...series.map((s) => s.value)) : 0;

  return (
    <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/[0.035] shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[var(--brand-gold)]">
          {label}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
          {delta !== 0 && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                isUp ? 'text-success' : 'text-destructive'
              )}
            >
              {isUp ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {formatPercent(delta)}
            </span>
          )}
        </div>
        {series && (
          <div className="flex h-10 items-end gap-1.5">
            {series.map((point, i) => (
              <div
                key={i}
                className="group relative flex-1"
                title={`${point.label}: ${point.value}`}
              >
                <div
                  className={cn(
                    'w-full rounded-sm transition-all duration-300',
                    isUp ? 'bg-success/60' : 'bg-destructive/60',
                    'group-hover:h-full'
                  )}
                  style={{
                    height: `${(point.value / max) * 100}%`,
                    minHeight: '4px',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
