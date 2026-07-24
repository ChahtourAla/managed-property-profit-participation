'use client';

import * as React from 'react';
import { Coins, Users } from 'lucide-react';

import { investments, type Investment } from '@/lib/mock-investments';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/dashboard/page-header';
import { SearchInput } from '@/components/dashboard/search-input';
import { FilterBar, type FilterOption } from '@/components/dashboard/filter-bar';
import { DataTable, type Column } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const statusOptions: FilterOption[] = [
  { label: 'Approved', value: 'Approved' },
  { label: 'Subscribed', value: 'Subscribed' },
  { label: 'Funding pending', value: 'Funding pending' },
  { label: 'Funded', value: 'Funded' },
  { label: 'Tokens issued', value: 'Tokens issued' },
  { label: 'Reward pending', value: 'Reward pending' },
  { label: 'Paid', value: 'Paid' },
];

export default function InvestmentsPage() {
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const filtered = React.useMemo(() => {
    return investments.filter((item) => {
      const haystack = `${item.holder} ${item.contractId} ${item.instrumentId}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (filters.Status && item.status !== filters.Status) return false;
      if (filters.Role && item.role !== filters.Role) return false;
      return true;
    });
  }, [search, filters]);

  const totalUpfront = investments.reduce((sum, item) => sum + item.upfrontPaid, 0);
  const totalReward = investments.reduce((sum, item) => sum + item.expectedReward, 0);
  const totalUnits = investments.reduce((sum, item) => sum + item.units, 0);

  const columns: Column<Investment>[] = [
    {
      key: 'holder',
      header: 'Holder',
      sortable: true,
      sortValue: (row) => row.holder,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.holder}</span>
          <span className="text-xs text-muted-foreground">
            {row.contractId} - {row.instrumentId}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      sortValue: (row) => row.role,
      cell: (row) => <StatusBadge status={row.role} />,
    },
    {
      key: 'units',
      header: 'Units',
      sortable: true,
      sortValue: (row) => row.units,
      align: 'right',
      cell: (row) => <span className="font-semibold tabular-nums">{row.units}</span>,
    },
    {
      key: 'upfrontPaid',
      header: 'Upfront paid',
      sortable: true,
      sortValue: (row) => row.upfrontPaid,
      align: 'right',
      cell: (row) => (
        <span className="font-semibold tabular-nums">{formatCurrency(row.upfrontPaid)}</span>
      ),
    },
    {
      key: 'expectedReward',
      header: 'Expected reward',
      sortable: true,
      sortValue: (row) => row.expectedReward,
      align: 'right',
      cell: (row) => (
        <span className="font-semibold tabular-nums text-success">
          {formatCurrency(row.expectedReward)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Lifecycle',
      sortable: true,
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'startDate',
      header: 'Subscribed',
      sortable: true,
      sortValue: (row) => row.startDate,
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.startDate)}</span>,
    },
    {
      key: 'snapshot',
      header: 'Snapshot',
      cell: (row) => <span className="text-muted-foreground">{row.snapshot}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Investor participation"
        description="Approved investors, funding confirmation, token holdings, and reward exposure."
      >
        <Button size="sm" className="gap-2">
          <Coins className="h-4 w-4" />
          Create subscription
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total upfront funding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">
              {formatCurrency(totalUpfront)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expected reward pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">
              {formatCurrency(totalReward)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Token units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tracking-tight">{totalUnits}</span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Search holder, contract, or instrument"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
        </div>

        <FilterBar
          filters={[
            { label: 'Status', options: statusOptions },
            { label: 'Role', options: [{ label: 'Owner', value: 'Owner' }, { label: 'Investor', value: 'Investor' }] },
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
              icon={Users}
              title="No participation records found"
              description="Try adjusting your search or filters."
            />
          }
        />
      </div>
    </>
  );
}
