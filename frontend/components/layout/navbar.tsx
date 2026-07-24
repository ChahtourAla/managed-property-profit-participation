'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-provider';
import { Breadcrumbs } from './breadcrumbs';
import { SearchInput } from '@/components/dashboard/search-input';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationDropdown } from './notification-dropdown';
import { UserDropdown } from './user-dropdown';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSession } from '@/lib/session';

export function Navbar() {
  const { setMobileOpen, collapsed } = useSidebar();
  const { session } = useSession();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/70 bg-background px-4 transition-[padding] duration-300 ease-in-out md:px-6'
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="hidden md:block">
          <Breadcrumbs />
        </div>
        <div className="hidden rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground shadow-sm lg:inline-flex">
          {session.role}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="hidden lg:block">
          <SearchInput
            placeholder="Search contract, investors, settlement"
            className="w-64"
          />
        </div>
        <ThemeToggle />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <NotificationDropdown />
        <UserDropdown />
      </div>
    </header>
  );
}
