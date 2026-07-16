'use client';

import * as React from 'react';
import { ScrollText, Search, SlidersHorizontal, ShieldCheck } from 'lucide-react';

import { transactions, type Transaction } from '@/lib/mock-transactions';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, type Column } from '@/components/dashboard/data-table';
import { EmptyState } from '@/components/dashboard/empty-state';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { SearchInput } from '@/components/dashboard/search-input';
import { FilterBar, type FilterOption } from '@/components/dashboard/filter-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const typeOptions: FilterOption[] = [
  { label: 'Submission', value: 'Submission' },
  { label: 'Validation', value: 'Validation' },
  { label: 'Instrument', value: 'Instrument' },
  { label: 'Subscription', value: 'Subscription' },
  { label: 'Funding', value: 'Funding' },
  { label: 'Report', value: 'Report' },
  { label: 'Reconciliation', value: 'Reconciliation' },
  { label: 'Reward', value: 'Reward' },
  { label: 'Payment', value: 'Payment' },
  { label: 'Closure', value: 'Closure' },
  { label: 'Redemption', value: 'Redemption' },
];

const statusOptions: FilterOption[] = [
  { label: 'Completed', value: 'Completed' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Processing', value: 'Processing' },
  { label: 'Failed', value: 'Failed' },
];

export default function TransactionsPage() {
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const filtered = React.useMemo(() => {
    return transactions.filter((event) => {
      const haystack = `${event.reference} ${event.description} ${event.method}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (filters.Type && event.type !== filters.Type) return false;
      if (filters.Status && event.status !== filters.Status) return false;
      return true;
    });
  }, [search, filters]);

  const columns: Column<Transaction>[] = [
    {
      key: 'reference',
      header: 'Reference',
      sortable: true,
      sortValue: (row) => row.reference,
      cell: (row) => <span className="font-mono text-xs font-medium">{row.reference}</span>,
    },
    {
      key: 'description',
      header: 'Event',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.description}</span>
          <span className="text-xs text-muted-foreground">{formatDate(row.date)}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      sortValue: (row) => row.type,
      cell: (row) => <Badge variant="outline">{row.type}</Badge>,
    },
    {
      key: 'method',
      header: 'Layer',
      cell: (row) => <span className="text-muted-foreground">{row.method}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      sortValue: (row) => row.amount,
      align: 'right',
      cell: (row) => (
        <span className="font-semibold tabular-nums">
          {row.amount ? formatCurrency(row.amount) : '—'}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit trail"
        description="A lifecycle log for the managed contract, funding, reconciliation, closure, and burn."
      >
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
        <Button size="sm" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Export audit
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-5">
          <div className="flex items-center gap-2 pb-1">
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Recorded events</span>
          </div>
          <span className="text-xl font-semibold tabular-nums">{transactions.length}</span>
        </div>
        <div className="rounded-xl border p-5">
          <div className="flex items-center gap-2 pb-1">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Canton anchored</span>
          </div>
          <span className="text-xl font-semibold tabular-nums">Yes</span>
        </div>
        <div className="rounded-xl border p-5">
          <div className="flex items-center gap-2 pb-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Visible to readers</span>
          </div>
          <span className="text-xl font-semibold tabular-nums">Role-based</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Search event, reference, or method"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
        </div>

        <FilterBar
          filters={[
            { label: 'Type', options: typeOptions },
            { label: 'Status', options: statusOptions },
          ]}
          activeFilters={filters}
          onFilterChange={(key, value) =>
            setFilters((prev) => ({ ...prev, [key]: value }))
          }
          onClearAll={() => setFilters({})}
        />

        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
          pageSize={10}
          emptyState={
            <EmptyState
              icon={ScrollText}
              title="No audit records found"
              description="Try adjusting your search or filters."
            />
          }
        />
      </div>
    </>
  );
}
