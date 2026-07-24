'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Navbar } from '@/components/layout/navbar';

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
  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  );
}
