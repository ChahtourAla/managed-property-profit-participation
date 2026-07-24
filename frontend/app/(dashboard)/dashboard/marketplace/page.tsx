'use client';

import * as React from 'react';
import { MapPin, TrendingUp, ArrowRight, Search } from 'lucide-react';

import { marketplaceListings } from '@/lib/mock-marketplace';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/dashboard/page-header';
import { SearchInput } from '@/components/dashboard/search-input';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const tagStyles: Record<string, string> = {
  Validated: 'bg-info/10 text-info border-info/20',
  Approved: 'bg-success/10 text-success border-success/20',
  'High Yield': 'bg-warning/10 text-warning border-warning/20',
  'Closing Soon': 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function MarketplacePage() {
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('all');

  const filtered = React.useMemo(() => {
    return marketplaceListings.filter((l) => {
      if (
        search &&
        !l.name.toLowerCase().includes(search.toLowerCase()) &&
        !l.location.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (type !== 'all' && l.type !== type) return false;
      return true;
    });
  }, [search, type]);

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Approved participation cases awaiting validation, structuring, or funding."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          placeholder="Search case or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-full sm:w-[180px]">
            <SelectValue placeholder="Case type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Residential">Residential</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
            <SelectItem value="Industrial">Industrial</SelectItem>
            <SelectItem value="Land">Land</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <Card>
            <CardContent>
              <EmptyState
                icon={Search}
                title="No cases found"
                description="Try adjusting your search or filters to discover available opportunities."
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => (
              <Card
              key={listing.id}
              className="group overflow-hidden transition-all hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <div className="h-full w-full bg-muted" />
                <div className="absolute left-3 top-3 flex gap-1.5">
                  {listing.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`bg-background ${tagStyles[tag] ?? ''}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="absolute right-3 top-3 rounded-md bg-background px-2 py-1 text-xs font-medium">
                  {listing.type}
                </div>
              </div>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-1">
                  <h3 className="font-semibold tracking-tight">{listing.name}</h3>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {listing.location}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Case value</span>
                    <span className="text-sm font-semibold">{formatCurrency(listing.price)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Expected yield</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-success">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {listing.expectedYield}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Funding progress</span>
                    <span className="font-medium">{listing.funded}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${listing.funded}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Min. participation</span>
                    <span className="text-sm font-semibold">{formatCurrency(listing.minInvestment)}</span>
                  </div>
                  <Button size="sm" className="gap-1.5">
                    Review
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
