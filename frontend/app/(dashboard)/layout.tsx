'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Navbar } from '@/components/layout/navbar';
import { SESSION_STORAGE_KEY, useSession } from '@/lib/session';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-background" />
      <Sidebar />
      <MobileSidebar />
      <div
        className={cn(
          'relative flex flex-col transition-[margin] duration-300 ease-in-out',
          collapsed ? 'md:ml-[72px]' : 'md:ml-[256px]'
        )}
      >
        <Navbar />
        <main
          className={cn(
            'flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8'
          )}
        >
          <div className="mx-auto w-full max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { ready } = useSession();
  const [authenticated, setAuthenticated] = React.useState(false);

  React.useEffect(() => {
    if (!ready) return;

    let hasSession = false;
    try {
      const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
      const stored = raw ? (JSON.parse(raw) as { accessToken?: unknown }) : null;
      hasSession = typeof stored?.accessToken === 'string' && !stored.accessToken.startsWith('demo-');
    } catch {
      hasSession = false;
    }
    if (!hasSession) {
      router.replace('/login');
      return;
    }
    setAuthenticated(true);
  }, [ready, router]);

  if (!ready || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking your session…
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  );
}
