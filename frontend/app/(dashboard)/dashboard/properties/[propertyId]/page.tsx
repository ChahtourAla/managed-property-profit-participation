'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { useSession } from '@/lib/session';
import { getPropertyDetails, type BackendProperty } from '@/lib/backend-api';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PropertyDetailsPage({ params }: { params: { propertyId: string } }) {
  const { session, ready } = useSession();
  const [property, setProperty] = React.useState<BackendProperty | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!ready || !session.accessToken) return;
    void getPropertyDetails(session.accessToken, params.propertyId)
      .then(setProperty)
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to load property details'))
      .finally(() => setLoading(false));
  }, [params.propertyId, ready, session.accessToken]);

  if (!ready || loading) {
    return <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading property details...</div>;
  }

  if (!property) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Property not found.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={property.name} description={`${property.propertyId} · ${property.propertyType || 'Property profile'}`}>
        <Button variant="outline" size="sm" className="gap-2" asChild><Link href="/dashboard/properties"><ArrowLeft className="h-4 w-4" /> Back to directory</Link></Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <Card className="order-1 overflow-hidden border-border/70 lg:order-1 lg:sticky lg:top-6">
          <div className="relative">
            {property.images?.[0] ? <img src={property.images[0].url} alt={property.images[0].caption || property.name} className="h-80 w-full object-cover" /> : <div className="flex h-80 items-center justify-center bg-muted/30 text-sm text-muted-foreground">No image available</div>}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pb-4 pt-12 text-white"><div><p className="text-xs uppercase tracking-[0.16em] text-white/75">Property gallery</p><p className="mt-1 text-sm">{property.images?.[0]?.caption || 'Main property image'}</p></div><span className="rounded-full bg-black/40 px-3 py-1 text-xs backdrop-blur">{property.images?.length ?? 0} image{property.images?.length === 1 ? '' : 's'}</span></div>
          </div>
          {property.images && property.images.length > 1 && <div className="grid grid-cols-4 gap-2 p-3">{property.images.slice(0, 4).map((image) => <img key={image.id ?? image.url} src={image.url} alt={image.caption || property.name} className="h-16 w-full rounded-lg object-cover" />)}</div>}
        </Card>

        <Card className="order-2 h-full border-border/70 lg:order-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="text-lg">Property overview</CardTitle><CardDescription className="mt-1">{[property.address, property.city, property.country].filter(Boolean).join(', ') || 'Location not provided'}</CardDescription></div><StatusBadge status={property.status} /></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[['Surface', property.surfaceArea != null ? `${property.surfaceArea} m²` : 'Not provided'], ['Rooms', property.rooms ?? 'Not provided'], ['Bedrooms', property.bedrooms ?? 'Not provided'], ['Bathrooms', property.bathrooms ?? 'Not provided'], ['Expected income', property.expectedRentalIncome != null ? formatCurrency(property.expectedRentalIncome) : 'Not provided'], ['Expected expenses', property.expectedExpenses != null ? formatCurrency(property.expectedExpenses) : 'Not provided'], ['Images', property.images?.length ?? 0], ['Documents', property.documents?.length ?? 0]].map(([label, value]) => <div key={label} className="rounded-xl border border-border/70 bg-muted/20 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 font-semibold">{value}</p></div>)}
            <div className="rounded-xl border border-border/70 p-4 sm:col-span-2"><p className="text-xs uppercase tracking-wider text-muted-foreground">Description</p><p className="mt-2 text-sm leading-6">{property.description || 'No description provided.'}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-lg">Documents</CardTitle><CardDescription>Documents linked to this property.</CardDescription></CardHeader><CardContent>{property.documents?.length ? <div className="space-y-2">{property.documents.map((document) => <a key={document.id ?? document.url} href={document.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm transition hover:bg-muted/40"><span className="truncate font-medium">{document.name}</span><span className="shrink-0 text-primary">Open →</span></a>)}</div> : <p className="text-sm text-muted-foreground">No documents added.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-lg">Rental history</CardTitle><CardDescription>Historical performance records.</CardDescription></CardHeader><CardContent>{property.rentalHistory?.length ? <div className="space-y-2">{property.rentalHistory.map((history) => <div key={history.id ?? history.periodLabel} className="grid grid-cols-3 gap-2 rounded-xl bg-muted/30 p-3 text-sm"><div><p className="text-xs text-muted-foreground">Period</p><p className="font-medium">{history.periodLabel}</p></div><div><p className="text-xs text-muted-foreground">Income</p><p className="font-medium">{formatCurrency(history.rentalIncome)}</p></div><div><p className="text-xs text-muted-foreground">Net income</p><p className="font-medium">{history.netIncome != null ? formatCurrency(history.netIncome) : '—'}</p></div></div>)}</div> : <p className="text-sm text-muted-foreground">No rental history added.</p>}</CardContent></Card>
      </div>
    </div>
  );
}
