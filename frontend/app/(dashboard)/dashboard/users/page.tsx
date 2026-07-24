'use client';

import * as React from 'react';
import { CheckCircle2, Loader2, RefreshCw, Search, UserCheck, UserX, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { approveUser, deactivateUser, getPendingUsers, getUsers, reactivateUser, rejectUser, type BackendUser } from '@/lib/backend-api';
import { useSession } from '@/lib/session';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function displayPartyName(partyId?: string | null) {
  return partyId?.split('::')[0] || 'No party assigned';
}

export default function UsersPage() {
  const { session } = useSession();
  const [users, setUsers] = React.useState<BackendUser[]>([]);
  const [pendingUsers, setPendingUsers] = React.useState<BackendUser[]>([]);
  const [partyIds, setPartyIds] = React.useState<Record<string, string>>({});
  const [approvingUser, setApprovingUser] = React.useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = React.useState<Record<string, string>>({});
  const [rejectingUser, setRejectingUser] = React.useState<string | null>(null);
  const [deactivatingUser, setDeactivatingUser] = React.useState<string | null>(null);
  const [reactivatingUser, setReactivatingUser] = React.useState<string | null>(null);
  const [actionUser, setActionUser] = React.useState<BackendUser | null>(null);
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    if (session.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const [allUsers, waitingUsers] = await Promise.all([
        getUsers(session.accessToken),
        getPendingUsers(session.accessToken),
      ]);
      setUsers(allUsers);
      setPendingUsers(waitingUsers);
      setPartyIds((current) => Object.fromEntries(
        waitingUsers.map((user) => [user.id, current[user.id] ?? user.partyId ?? ''])
      ));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, session.role]);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadUsers();
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async (user: BackendUser) => {
    const partyId = partyIds[user.id]?.trim();
    if (!partyId) {
      toast.error('Enter a Daml party ID before approving this user.');
      return;
    }

    setApprovingUser(user.id);
    try {
      await approveUser(session.accessToken, user.id, partyId);
      toast.success(`${user.fullName || user.email} approved.`);
      setActionUser(null);
      setActionType(null);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to approve user');
    } finally {
      setApprovingUser(null);
    }
  };

  const handleReject = async (user: BackendUser) => {
    const reason = rejectReasons[user.id]?.trim();
    if (!reason) {
      toast.error('Enter a reason before rejecting this user.');
      return;
    }

    setRejectingUser(user.id);
    try {
      await rejectUser(session.accessToken, user.id, reason);
      toast.success(`${user.fullName || user.email} rejected.`);
      setActionUser(null);
      setActionType(null);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reject user');
    } finally {
      setRejectingUser(null);
    }
  };

  const handleDeactivate = async (user: BackendUser) => {
    setDeactivatingUser(user.id);
    try {
      await deactivateUser(session.accessToken, user.id);
      toast.success(`${user.fullName || user.email} deactivated.`);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to deactivate user');
    } finally {
      setDeactivatingUser(null);
    }
  };

  const handleReactivate = async (user: BackendUser) => {
    setReactivatingUser(user.id);
    try {
      await reactivateUser(session.accessToken, user.id);
      toast.success(`${user.fullName || user.email} reactivated.`);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reactivate user');
    } finally {
      setReactivatingUser(null);
    }
  };

  const roles = Array.from(new Set(users.map((user) => user.role))).sort();
  const matchesFilter = (user: BackendUser) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [user.fullName, user.email, user.partyId, user.role]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'active' && user.isActive)
      || (statusFilter === 'inactive' && !user.isActive)
      || (statusFilter === 'pending' && user.approvalStatus === 'PENDING')
      || (statusFilter === 'approved' && user.approvalStatus === 'APPROVED');
    return matchesSearch && matchesRole && matchesStatus;
  };

  const visibleUsers = users.filter(matchesFilter);
  const visiblePendingUsers = pendingUsers.filter(matchesFilter);

  if (session.role !== 'ADMIN') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User management</CardTitle>
          <CardDescription>This page is available to administrators only.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="User management"
        description="Review all platform users and their access status."
      >
        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/10 bg-gradient-to-br from-primary/[0.05] to-background shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total users</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums">{users.length}</p></CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/[0.03] shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending approval</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums">{pendingUsers.length}</p></CardContent>
        </Card>
        <Card className="border-success/15 bg-success/[0.03] shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active accounts</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums">{users.filter((user) => user.isActive).length}</p></CardContent>
        </Card>
        <Card className="border-success/15 bg-success/[0.06] shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Approved accounts</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums">{users.filter((user) => user.approvalStatus === 'APPROVED').length}</p></CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-primary/10 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Platform users</CardTitle>
            <CardDescription>{visibleUsers.length} of {users.length} users shown.</CardDescription>
          </div>
        </CardHeader>
        <div className="border-y border-border/60 bg-muted/[0.18] px-6 py-4 sm:px-7">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or Party ID..." className="bg-background pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="ghost" onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}>
              Clear filters
            </Button>
          </div>
        </div>
        <CardContent className="pt-6 sm:pt-7">
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-10 text-sm text-muted-foreground">No users returned.</div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleUsers.map((user) => (
                <div key={user.id} className="grid min-w-0 gap-4 rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/25 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {(user.fullName || user.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{user.fullName || user.email}</p>
                      <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                      <p className="truncate text-xs text-muted-foreground">{displayPartyName(user.partyId)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-xs font-medium">
                    <span className="rounded-full bg-muted px-2.5 py-1">{user.role}</span>
                    <span className="rounded-full border border-border px-2.5 py-1">{user.approvalStatus}</span>
                    <span className={user.approvalStatus === 'PENDING' ? 'rounded-full bg-warning/10 px-2.5 py-1 text-warning' : user.isActive ? 'rounded-full bg-success/10 px-2.5 py-1 text-success' : 'rounded-full bg-muted px-2.5 py-1 text-muted-foreground'}>
                      {user.approvalStatus === 'PENDING' ? 'Pending' : user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {user.isActive && user.approvalStatus === 'APPROVED' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-xl text-destructive hover:text-destructive"
                        onClick={() => void handleDeactivate(user)}
                        disabled={deactivatingUser === user.id}
                      >
                        {deactivatingUser === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                        Deactivate
                      </Button>
                    )}
                    {!user.isActive && user.approvalStatus === 'APPROVED' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-xl text-success hover:text-success"
                        onClick={() => void handleReactivate(user)}
                        disabled={reactivatingUser === user.id}
                      >
                        {reactivatingUser === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                        Reactivate
                      </Button>
                    )}
                  </div>
                  {user.approvalStatus === 'PENDING' && (
                    <div className="w-full space-y-2 border-t border-warning/20 pt-3 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Choose an action</p>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" className="gap-2" onClick={() => { setActionUser(user); setActionType('approve'); }}>
                          <CheckCircle2 className="h-4 w-4" />
                          Approve access
                        </Button>
                        <Button type="button" variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => { setActionUser(user); setActionType('reject'); }}>
                          <XCircle className="h-4 w-4" />
                          Reject request
                        </Button>
                      </div>
                      {/*
                      <div>
                            <div className="flex min-w-0 gap-2 pb-3">
                        <Input
                          className="min-w-0 flex-1"
                          value={partyIds[user.id] ?? ''}
                          onChange={(event) => setPartyIds((current) => ({ ...current, [user.id]: event.target.value }))}
                          placeholder="Daml Party ID — Owner::1220abc..."
                          aria-label={`Daml party ID for ${user.email}`}
                        />
                        <Button
                          className="shrink-0 gap-2 lg:w-32"
                          onClick={() => void handleApprove(user)}
                          disabled={approvingUser === user.id}
                        >
                          {approvingUser === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Approve
                        </Button>
                            </div>
                          </div>
                        </div>
                        <div>
                            <div className="flex min-w-0 gap-2 pb-3">
                        <Input
                          className="min-w-0 flex-1"
                          value={rejectReasons[user.id] ?? ''}
                          onChange={(event) => setRejectReasons((current) => ({ ...current, [user.id]: event.target.value }))}
                          placeholder="Rejection reason..."
                          aria-label={`Rejection reason for ${user.email}`}
                        />
                        <Button
                          variant="outline"
                          className="shrink-0 gap-2 lg:w-32"
                          onClick={() => void handleReject(user)}
                          disabled={rejectingUser === user.id}
                        >
                          {rejectingUser === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Reject
                        </Button>
                            </div>
                          </div>
                        </div>
                      */}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <Dialog open={Boolean(actionUser)} onOpenChange={(open) => { if (!open) { setActionUser(null); setActionType(null); } }}>
          <DialogContent className="max-w-md">
            {actionUser && actionType === 'approve' && (
              <>
                <DialogHeader>
                  <DialogTitle>Approve access</DialogTitle>
                  <DialogDescription>Assign a Daml Party ID to activate {actionUser.fullName || actionUser.email}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={partyIds[actionUser.id] ?? ''}
                    onChange={(event) => setPartyIds((current) => ({ ...current, [actionUser.id]: event.target.value }))}
                    placeholder="Owner::1220abc..."
                    aria-label="Daml Party ID"
                  />
                  <Button className="w-full gap-2" onClick={() => void handleApprove(actionUser)} disabled={approvingUser === actionUser.id}>
                    {approvingUser === actionUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve user
                  </Button>
                </div>
              </>
            )}
            {actionUser && actionType === 'reject' && (
              <>
                <DialogHeader>
                  <DialogTitle>Reject request</DialogTitle>
                  <DialogDescription>Tell the user what needs to be corrected before requesting access again.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={rejectReasons[actionUser.id] ?? ''}
                    onChange={(event) => setRejectReasons((current) => ({ ...current, [actionUser.id]: event.target.value }))}
                    placeholder="Reason for rejection..."
                    aria-label="Rejection reason"
                  />
                  <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive" onClick={() => void handleReject(actionUser)} disabled={rejectingUser === actionUser.id}>
                    {rejectingUser === actionUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject user
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      {/*
      <div className="border-t border-warning/20">
      <div className="bg-warning/[0.025]">
        <CardHeader className="space-y-3 border-b border-warning/15 bg-warning/[0.025]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Pending approval</CardTitle>
              <CardDescription>Review these account requests before granting platform access.</CardDescription>
            </div>
            <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
              {visiblePendingUsers.length} waiting
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Approve an account only after assigning its Daml Party ID. Reject it when the request needs to be corrected.
          </p>
        </CardHeader>
        <div className="p-6 pt-0 sm:p-7 sm:pt-0">
          {visiblePendingUsers.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
              No pending users.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {visiblePendingUsers.map((user) => (
                <div key={user.id} className="min-w-0 rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/[0.05] to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-warning">Account request</p>
                      <p className="truncate font-medium">{user.fullName || user.email}</p>
                      <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.role} · {displayPartyName(user.partyId)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                      Pending
                    </span>
                  </div>
                  <div className="mt-5 space-y-2 rounded-xl border border-success/15 bg-success/[0.03] p-3">
                    <p className="text-xs font-semibold text-success">Approve access</p>
                    <p className="text-xs text-muted-foreground">Assign the user’s Daml Party ID to activate the account.</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={partyIds[user.id] ?? ''}
                      onChange={(event) => setPartyIds((current) => ({ ...current, [user.id]: event.target.value }))}
                      placeholder="Owner::1220abc..."
                      aria-label={`Daml party ID for ${user.email}`}
                    />
                    <Button
                      className="shrink-0 gap-2 sm:w-32"
                      onClick={() => void handleApprove(user)}
                      disabled={approvingUser === user.id}
                    >
                      {approvingUser === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve
                    </Button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 rounded-xl border border-destructive/15 bg-destructive/[0.025] p-3">
                    <p className="text-xs font-semibold text-destructive">Reject request</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={rejectReasons[user.id] ?? ''}
                      onChange={(event) => setRejectReasons((current) => ({ ...current, [user.id]: event.target.value }))}
                      placeholder="Reason for rejection..."
                      aria-label={`Rejection reason for ${user.email}`}
                    />
                    <Button
                      variant="outline"
                      className="shrink-0 gap-2 sm:w-32"
                      onClick={() => void handleReject(user)}
                      disabled={rejectingUser === user.id}
                    >
                      {rejectingUser === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Reject
                    </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
      */}
      </Card>
    </>
  );
}
