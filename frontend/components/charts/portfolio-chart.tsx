'use client';

import * as React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { portfolioAllocation } from '@/lib/mock-stats';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md">
      <div className="flex items-center gap-2 text-sm">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: payload[0].payload.color }}
        />
        <span className="text-muted-foreground">{payload[0].name}:</span>
        <span className="font-medium">{payload[0].value}%</span>
      </div>
    </div>
  );
}

export function PortfolioChart() {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-[200px] w-full max-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={portfolioAllocation}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
            >
              {portfolioAllocation.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold">100%</span>
          <span className="text-xs text-muted-foreground">Allocated</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3">
        {portfolioAllocation.map((slice) => (
          <div key={slice.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-sm font-medium">{slice.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">{slice.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
