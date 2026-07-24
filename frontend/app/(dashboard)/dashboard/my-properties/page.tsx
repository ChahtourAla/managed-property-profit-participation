'use client';

import * as React from 'react';
import { Building2, FileText, ImagePlus, Loader2, MoreVertical, Pencil, Plus, RefreshCw, Send, Table2 } from 'lucide-react';

import { useSession } from '@/lib/session';
import {
  createPropertyProfile,
  addPropertyImage,
  addPropertyRentalHistory,
  addPropertyDocument,
  submitPropertyForReview,
  getMyProperties,
  getPropertyDetails,
  updatePropertyProfile,
  type BackendProperty,
} from '@/lib/backend-api';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type FormState = {
  name: string;
  description: string;
  propertyType: string;
  address: string;
  city: string;
  country: string;
  surfaceArea: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  expectedRentalIncome: string;
  expectedExpenses: string;
  currency: string;
};

const initialForm: FormState = {
  name: '',
  description: '',
  propertyType: 'Apartment',
  address: '',
  city: '',
  country: 'Morocco',
  surfaceArea: '',
  rooms: '',
  bedrooms: '',
  bathrooms: '',
  expectedRentalIncome: '',
  expectedExpenses: '',
  currency: 'MAD',
};

const numberValue = (value: string) => (value ? Number(value) : undefined);

function nextPropertyId(properties: BackendProperty[]) {
  const max = properties.reduce((current, property) => {
    const match = property.propertyId.match(/^PROP-(\d+)$/i);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `PROP-${String(max + 1).padStart(3, '0')}`;
}

function propertyToForm(property: BackendProperty): FormState {
  return {
    name: property.name,
    description: property.description ?? '',
    propertyType: property.propertyType ?? 'Apartment',
    address: property.address ?? '',
    city: property.city ?? '',
    country: property.country ?? 'Morocco',
    surfaceArea: property.surfaceArea?.toString() ?? '',
    rooms: property.rooms?.toString() ?? '',
    bedrooms: property.bedrooms?.toString() ?? '',
    bathrooms: property.bathrooms?.toString() ?? '',
    expectedRentalIncome: property.expectedRentalIncome?.toString() ?? '',
    expectedExpenses: property.expectedExpenses?.toString() ?? '',
    currency: property.currency ?? 'MAD',
  };
}

export default function MyPropertiesPage() {
  const { session, ready } = useSession();
  const [properties, setProperties] = React.useState<BackendProperty[]>([]);
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selected, setSelected] = React.useState<BackendProperty | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState<FormState>(initialForm);
  const [updating, setUpdating] = React.useState(false);
  const [propertyAction, setPropertyAction] = React.useState<'edit' | 'image' | 'rental' | 'document' | 'review' | null>(null);
  const [addingImage, setAddingImage] = React.useState(false);
  const [imageForm, setImageForm] = React.useState({ url: '', caption: '', isMain: false, sortOrder: '0' });
  const [addingRentalHistory, setAddingRentalHistory] = React.useState(false);
  const [rentalForm, setRentalForm] = React.useState({ periodLabel: '', rentalIncome: '', expenses: '', occupancyRate: '', netIncome: '' });
  const [addingDocument, setAddingDocument] = React.useState(false);
  const [documentForm, setDocumentForm] = React.useState({ name: '', url: '', documentHash: '' });
  const [submittingReview, setSubmittingReview] = React.useState(false);

  const loadProperties = React.useCallback(async () => {
    if (!session.accessToken) return;
    setLoading(true);
    try {
      setProperties(await getMyProperties(session.accessToken));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load properties');
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  React.useEffect(() => {
    if (ready && session.role === 'OWNER') void loadProperties();
  }, [loadProperties, ready, session.role]);

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Enter a property name');
      return;
    }

    setSaving(true);
    try {
      const created = await createPropertyProfile(session.accessToken, {
        propertyId: nextPropertyId(properties),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        propertyType: form.propertyType.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        surfaceArea: numberValue(form.surfaceArea),
        rooms: numberValue(form.rooms),
        bedrooms: numberValue(form.bedrooms),
        bathrooms: numberValue(form.bathrooms),
        expectedRentalIncome: numberValue(form.expectedRentalIncome),
        expectedExpenses: numberValue(form.expectedExpenses),
        currency: form.currency.trim().toUpperCase() || 'MAD',
      });
      setProperties((current) => [created, ...current]);
      setForm(initialForm);
      toast.success('Property profile created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create property');
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (property: BackendProperty) => {
    setSelected(property);
    setEditForm(propertyToForm(property));
    setEditing(false);
    setPropertyAction(null);
    setDetailsLoading(true);
    try {
      setSelected(await getPropertyDetails(session.accessToken, property.propertyId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load property details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const openPropertyAction = (property: BackendProperty, action: 'edit' | 'image' | 'rental' | 'document' | 'review') => {
    setSelected(property);
    setEditForm(propertyToForm(property));
    setPropertyAction(action);
    setEditing(action === 'edit');
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await updatePropertyProfile(session.accessToken, selected.propertyId, {
        propertyId: selected.propertyId,
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        propertyType: editForm.propertyType.trim() || undefined,
        address: editForm.address.trim() || undefined,
        city: editForm.city.trim() || undefined,
        country: editForm.country.trim() || undefined,
        surfaceArea: numberValue(editForm.surfaceArea),
        rooms: numberValue(editForm.rooms),
        bedrooms: numberValue(editForm.bedrooms),
        bathrooms: numberValue(editForm.bathrooms),
        expectedRentalIncome: numberValue(editForm.expectedRentalIncome),
        expectedExpenses: numberValue(editForm.expectedExpenses),
        currency: editForm.currency.trim().toUpperCase() || 'MAD',
      });
      setProperties((current) => current.map((property) => property.propertyId === updated.propertyId ? updated : property));
      setSelected(updated);
      setEditing(false);
      toast.success('Property profile updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update property');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddImage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !imageForm.url.trim()) {
      toast.error('Enter an image URL or path');
      return;
    }

    setAddingImage(true);
    try {
      const image = await addPropertyImage(session.accessToken, selected.propertyId, {
        url: imageForm.url.trim(),
        caption: imageForm.caption.trim() || undefined,
        isMain: imageForm.isMain,
        sortOrder: Number(imageForm.sortOrder) || 0,
      });
      const nextProperty = { ...selected, images: [image, ...(selected.images ?? [])] };
      setSelected(nextProperty);
      setProperties((current) => current.map((property) => property.propertyId === nextProperty.propertyId ? nextProperty : property));
      setImageForm({ url: '', caption: '', isMain: false, sortOrder: '0' });
      toast.success('Property image added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to add image');
    } finally {
      setAddingImage(false);
    }
  };

  const handleAddRentalHistory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !rentalForm.periodLabel.trim() || !rentalForm.rentalIncome) {
      toast.error('Enter the period and rental income');
      return;
    }

    setAddingRentalHistory(true);
    try {
      const history = await addPropertyRentalHistory(session.accessToken, selected.propertyId, {
        periodLabel: rentalForm.periodLabel.trim(),
        rentalIncome: Number(rentalForm.rentalIncome),
        expenses: rentalForm.expenses ? Number(rentalForm.expenses) : undefined,
        occupancyRate: rentalForm.occupancyRate ? Number(rentalForm.occupancyRate) : undefined,
        netIncome: rentalForm.netIncome ? Number(rentalForm.netIncome) : undefined,
        currency: selected.currency ?? 'MAD',
      });
      const nextProperty = { ...selected, rentalHistory: [history, ...(selected.rentalHistory ?? [])] };
      setSelected(nextProperty);
      setProperties((current) => current.map((property) => property.propertyId === nextProperty.propertyId ? nextProperty : property));
      setRentalForm({ periodLabel: '', rentalIncome: '', expenses: '', occupancyRate: '', netIncome: '' });
      toast.success('Rental history added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to add rental history');
    } finally {
      setAddingRentalHistory(false);
    }
  };

  const handleAddDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !documentForm.name.trim() || !documentForm.url.trim()) {
      toast.error('Enter the document name and URL or path');
      return;
    }

    setAddingDocument(true);
    try {
      const document = await addPropertyDocument(session.accessToken, selected.propertyId, {
        name: documentForm.name.trim(),
        url: documentForm.url.trim(),
        documentHash: documentForm.documentHash.trim() || undefined,
      });
      const nextProperty = { ...selected, documents: [document, ...(selected.documents ?? [])] };
      setSelected(nextProperty);
      setProperties((current) => current.map((property) => property.propertyId === nextProperty.propertyId ? nextProperty : property));
      setDocumentForm({ name: '', url: '', documentHash: '' });
      toast.success('Property document added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to add document');
    } finally {
      setAddingDocument(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!selected) return;
    setSubmittingReview(true);
    try {
      const updated = await submitPropertyForReview(session.accessToken, selected.propertyId);
      setSelected(updated);
      setProperties((current) => current.map((property) => property.propertyId === updated.propertyId ? updated : property));
      toast.success('Property submitted for review');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit property for review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!ready) return null;

  if (session.role !== 'OWNER') {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">This page is available to property owners.</CardContent></Card>;
  }

  return (
    <>
      <PageHeader title="My properties" description="Create and manage the property profiles used for your investment contracts.">
        <Button variant="outline" size="sm" className="gap-2" onClick={async () => { setRefreshing(true); await loadProperties(); setRefreshing(false); }} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Property profiles</CardTitle>
            <CardDescription>{properties.length} profile{properties.length === 1 ? '' : 's'} created by your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading properties...</div> : properties.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No property profile yet.</p> : <div className="grid gap-3 sm:grid-cols-2">
              {properties.map((property) => <div key={property.propertyId} role="button" tabIndex={0} onClick={() => void openDetails(property)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') void openDetails(property); }} className="overflow-hidden rounded-xl border border-border/70 text-left transition hover:border-primary/40 hover:shadow-md">
                {property.images?.[0] ? <img src={property.images[0].url} alt={property.images[0].caption || property.name} className="h-40 w-full object-cover" /> : <div className="flex h-40 items-center justify-center bg-muted/30 text-xs text-muted-foreground">No image available</div>}
                <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{property.name}</p><p className="mt-1 text-xs text-muted-foreground">{property.propertyId}</p></div><div className="flex items-center gap-2"><StatusBadge status={property.status} />{property.status === 'DRAFT' && <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={(event) => event.stopPropagation()}><MoreVertical className="h-4 w-4" /><span className="sr-only">Property actions</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}><DropdownMenuItem onClick={() => openPropertyAction(property, 'edit')}><Pencil className="mr-2 h-4 w-4" /> Edit property</DropdownMenuItem><DropdownMenuItem onClick={() => openPropertyAction(property, 'image')}><ImagePlus className="mr-2 h-4 w-4" /> Add image</DropdownMenuItem><DropdownMenuItem onClick={() => openPropertyAction(property, 'rental')}><Table2 className="mr-2 h-4 w-4" /> Add rental history</DropdownMenuItem><DropdownMenuItem onClick={() => openPropertyAction(property, 'document')}><FileText className="mr-2 h-4 w-4" /> Add document</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openPropertyAction(property, 'review')}><Send className="mr-2 h-4 w-4" /> Submit for review</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</div></div>
                <p className="mt-3 text-sm text-muted-foreground">{[property.city, property.country].filter(Boolean).join(', ') || 'Location not provided'}</p>
                <p className="mt-3 text-xs font-medium text-primary">View details →</p>
                </div>
              </div>)}
            </div>}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader><CardTitle>Create property profile</CardTitle><CardDescription>Save a property before creating its contract draft.</CardDescription></CardHeader>
          <form onSubmit={handleCreate}>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Property name</Label><Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Managed Apartment Casablanca" /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe the property..." /></div>
              {(['propertyType', 'address', 'city', 'country', 'surfaceArea', 'rooms', 'bedrooms', 'bathrooms', 'expectedRentalIncome', 'expectedExpenses', 'currency'] as const).map((field) => <div key={field} className="space-y-2"><Label>{field.replace(/([A-Z])/g, ' $1')}</Label><Input type={['surfaceArea', 'rooms', 'bedrooms', 'bathrooms', 'expectedRentalIncome', 'expectedExpenses'].includes(field) ? 'number' : 'text'} value={form[field]} onChange={(e) => update(field, e.target.value)} /></div>)}
            </CardContent>
            <div className="border-t px-6 py-4"><Button type="submit" className="w-full gap-2" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? 'Creating...' : 'Create property profile'}</Button></div>
          </form>
        </Card>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="!flex !flex-col max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {selected && (
            <>
              <DialogHeader className="border-b border-border/60 pb-4">
                <DialogTitle className="text-2xl tracking-tight">{editing ? 'Edit property' : selected.name}</DialogTitle>
                <DialogDescription>{selected.propertyId} · {selected.propertyType || 'Property'} · Owner profile</DialogDescription>
              </DialogHeader>
              {editing || propertyAction === 'edit' ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2"><Label>Property name</Label><Input value={editForm.name} onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))} /></div>
                    <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea value={editForm.description} onChange={(e) => setEditForm((current) => ({ ...current, description: e.target.value }))} /></div>
                    {(['propertyType', 'address', 'city', 'country', 'surfaceArea', 'rooms', 'bedrooms', 'bathrooms', 'expectedRentalIncome', 'expectedExpenses', 'currency'] as const).map((field) => <div key={field} className="space-y-2"><Label>{field.replace(/([A-Z])/g, ' $1')}</Label><Input type={['surfaceArea', 'rooms', 'bedrooms', 'bathrooms', 'expectedRentalIncome', 'expectedExpenses'].includes(field) ? 'number' : 'text'} value={editForm[field]} onChange={(e) => setEditForm((current) => ({ ...current, [field]: e.target.value }))} /></div>)}
                  </div>
                  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setEditing(false); setPropertyAction(null); }}>Cancel</Button><Button type="submit" disabled={updating}>{updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{updating ? 'Saving...' : 'Save changes'}</Button></div>
                </form>
              ) : (
                <>
                  {detailsLoading && <p className="text-sm text-muted-foreground">Loading complete details...</p>}
                  <div className="grid gap-3 sm:grid-cols-2">{[['Status', selected.status], ['Location', [selected.address, selected.city, selected.country].filter(Boolean).join(', ') || 'Not provided'], ['Surface', selected.surfaceArea != null ? `${selected.surfaceArea} m²` : 'Not provided'], ['Rooms', selected.rooms ?? 'Not provided'], ['Bedrooms', selected.bedrooms ?? 'Not provided'], ['Bathrooms', selected.bathrooms ?? 'Not provided'], ['Income', selected.expectedRentalIncome != null ? formatCurrency(selected.expectedRentalIncome) : 'Not provided'], ['Expenses', selected.expectedExpenses != null ? formatCurrency(selected.expectedExpenses) : 'Not provided']].map(([label, value]) => <div key={label} className="rounded-xl border p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 font-medium">{value}</p></div>)}<div className="rounded-xl border p-4 sm:col-span-2"><p className="text-xs uppercase tracking-wider text-muted-foreground">Description</p><p className="mt-2 text-sm leading-6">{selected.description || 'No description provided.'}</p></div></div>
                  {selected.images && selected.images.length > 0 && <div className="rounded-2xl border border-border/70 bg-muted/[0.14] p-4 sm:col-span-2"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Property gallery</p><p className="mt-1 text-xs text-muted-foreground">{selected.images.length} image{selected.images.length === 1 ? '' : 's'} added</p></div><span className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground">Media</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{selected.images.map((image) => <a key={image.id ?? image.url} href={image.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm"><img src={image.url} alt={image.caption || selected.name} className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /><div className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs"><span className="truncate">{image.caption || 'Property image'}</span>{image.isMain && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">Main</span>}</div></a>)}</div></div>}
                  {propertyAction === 'image' && selected.status === 'DRAFT' && <form onSubmit={handleAddImage} className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-background p-5 sm:col-span-2"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">Add property image</p><p className="mt-1 text-xs text-muted-foreground">Add a URL or server file path to enrich this profile.</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Draft only</span></div><div className="mt-4 space-y-3"><div className="space-y-1.5"><Label className="text-xs">Image URL or path</Label><Input placeholder="/uploads/properties/PROP-001/living-room.jpg" value={imageForm.url} onChange={(e) => setImageForm((current) => ({ ...current, url: e.target.value }))} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label className="text-xs">Caption</Label><Input placeholder="Living room" value={imageForm.caption} onChange={(e) => setImageForm((current) => ({ ...current, caption: e.target.value }))} /></div><div className="space-y-1.5"><Label className="text-xs">Display order</Label><Input type="number" min="0" placeholder="0" value={imageForm.sortOrder} onChange={(e) => setImageForm((current) => ({ ...current, sortOrder: e.target.value }))} /></div></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={imageForm.isMain} onChange={(e) => setImageForm((current) => ({ ...current, isMain: e.target.checked }))} /> Set as main image</label><Button type="submit" className="w-full" disabled={addingImage}>{addingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{addingImage ? 'Adding image...' : 'Add image'}</Button></div></form>}
                  {propertyAction === 'rental' && selected.status === 'DRAFT' && <form onSubmit={handleAddRentalHistory} className="rounded-2xl border border-border/70 bg-muted/[0.14] p-5 sm:col-span-2"><div><p className="text-sm font-semibold">Add rental history</p><p className="mt-1 text-xs text-muted-foreground">Record a previous rental period for this property.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label className="text-xs">Period</Label><Input placeholder="2025" value={rentalForm.periodLabel} onChange={(e) => setRentalForm((current) => ({ ...current, periodLabel: e.target.value }))} /></div><div className="space-y-1.5"><Label className="text-xs">Rental income</Label><Input type="number" min="0" placeholder="110000" value={rentalForm.rentalIncome} onChange={(e) => setRentalForm((current) => ({ ...current, rentalIncome: e.target.value }))} /></div><div className="space-y-1.5"><Label className="text-xs">Expenses</Label><Input type="number" min="0" placeholder="22000" value={rentalForm.expenses} onChange={(e) => setRentalForm((current) => ({ ...current, expenses: e.target.value }))} /></div><div className="space-y-1.5"><Label className="text-xs">Occupancy rate</Label><Input type="number" min="0" max="1" step="0.01" placeholder="0.87" value={rentalForm.occupancyRate} onChange={(e) => setRentalForm((current) => ({ ...current, occupancyRate: e.target.value }))} /></div><div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Net income</Label><Input type="number" min="0" placeholder="88000" value={rentalForm.netIncome} onChange={(e) => setRentalForm((current) => ({ ...current, netIncome: e.target.value }))} /></div></div><Button type="submit" className="mt-4 w-full" disabled={addingRentalHistory}>{addingRentalHistory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{addingRentalHistory ? 'Saving history...' : 'Add rental history'}</Button></form>}
                  {selected.rentalHistory && selected.rentalHistory.length > 0 && <div className="rounded-2xl border border-border/70 p-4 sm:col-span-2"><div><p className="text-sm font-semibold">Rental history</p><p className="mt-1 text-xs text-muted-foreground">{selected.rentalHistory.length} recorded period{selected.rentalHistory.length === 1 ? '' : 's'}</p></div><div className="mt-3 space-y-2">{selected.rentalHistory.map((history) => <div key={history.id ?? history.periodLabel} className="grid gap-2 rounded-xl bg-muted/30 px-3 py-3 text-sm sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Period</p><p className="font-medium">{history.periodLabel}</p></div><div><p className="text-xs text-muted-foreground">Income</p><p className="font-medium">{formatCurrency(history.rentalIncome)}</p></div><div><p className="text-xs text-muted-foreground">Expenses</p><p className="font-medium">{formatCurrency(history.expenses ?? 0)}</p></div><div><p className="text-xs text-muted-foreground">Net income</p><p className="font-medium">{history.netIncome != null ? formatCurrency(history.netIncome) : '—'}</p></div></div>)}</div></div>}
                  {selected.documents && selected.documents.length > 0 && <div className="rounded-2xl border border-border/70 p-4 sm:col-span-2"><div><p className="text-sm font-semibold">Documents</p><p className="mt-1 text-xs text-muted-foreground">{selected.documents.length} document{selected.documents.length === 1 ? '' : 's'} added</p></div><div className="mt-3 space-y-2">{selected.documents.map((document) => <a key={document.id ?? document.url} href={document.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 px-3 py-3 text-sm hover:bg-muted/50"><span className="truncate font-medium">{document.name}</span><span className="shrink-0 text-primary">Open →</span></a>)}</div></div>}
                  {propertyAction === 'document' && selected.status === 'DRAFT' && <form onSubmit={handleAddDocument} className="rounded-2xl border border-border/70 bg-muted/[0.14] p-5 sm:col-span-2"><div><p className="text-sm font-semibold">Add property document</p><p className="mt-1 text-xs text-muted-foreground">Add a document URL or server file path.</p></div><div className="mt-4 space-y-3"><div className="space-y-1.5"><Label className="text-xs">Document name</Label><Input placeholder="Property valuation report" value={documentForm.name} onChange={(e) => setDocumentForm((current) => ({ ...current, name: e.target.value }))} /></div><div className="space-y-1.5"><Label className="text-xs">Document URL or path</Label><Input placeholder="/uploads/properties/PROP-001/valuation-report.pdf" value={documentForm.url} onChange={(e) => setDocumentForm((current) => ({ ...current, url: e.target.value }))} /></div><div className="space-y-1.5"><Label className="text-xs">Document hash (optional)</Label><Input placeholder="HASH-DOCUMENT-001" value={documentForm.documentHash} onChange={(e) => setDocumentForm((current) => ({ ...current, documentHash: e.target.value }))} /></div><Button type="submit" className="w-full" disabled={addingDocument}>{addingDocument && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{addingDocument ? 'Adding document...' : 'Add document'}</Button></div></form>}
                  {propertyAction && selected.status === 'DRAFT' && <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => { setEditing(true); setPropertyAction('edit'); }}>Edit property details</Button><Button onClick={handleSubmitForReview} disabled={submittingReview}>{submittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{submittingReview ? 'Submitting...' : 'Submit for review'}</Button></div>}
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
