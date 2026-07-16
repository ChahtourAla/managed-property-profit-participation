'use client';

import * as React from 'react';
import { Filter, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type FilterOption = {
  label: string;
  value: string;
};

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  className,
}: {
  filters: { label: string; options: FilterOption[] }[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearAll?: () => void;
  className?: string;
}) {
  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:gap-2',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {activeCount}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <select
            key={filter.label}
            value={activeFilters[filter.label] ?? ''}
            onChange={(e) => onFilterChange(filter.label, e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">{filter.label}: All</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {activeCount > 0 && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-9 gap-1.5 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear all
        </Button>
      )}
    </div>
  );
}
