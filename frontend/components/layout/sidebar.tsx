'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getNavForRole } from '@/lib/navigation';
import { useSidebar } from './sidebar-provider';
import { useSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrandLogo } from '@/components/brand-logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const { session } = useSession();
  const navGroups = getNavForRole(session.role);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border/80 bg-sidebar transition-[width] duration-300 ease-in-out md:flex',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border/80 px-4">
        <BrandLogo compact={collapsed} className={collapsed ? 'mx-auto' : ''} />
        {!collapsed && <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">{session.role}</span>}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col gap-6">
            {navGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                {!collapsed && (
                  <h4 className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                    {group.label}
                  </h4>
                )}
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' &&
                      pathname.startsWith(item.href));
                  const link = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        collapsed && 'justify-center px-0',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:translate-x-0.5'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_18px_rgba(59,130,246,0.55)]" />
                      )}
                      <item.icon
                        className={cn(
                          'h-[1.15rem] w-[1.15rem] shrink-0',
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  );
                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="font-medium"
                        >
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return link;
                })}
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      <div className="border-t border-sidebar-border/80 p-3">
        <Button
          variant="ghost"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          <ChevronsLeft
            className={cn(
              'h-[1.15rem] w-[1.15rem] transition-transform duration-300',
              collapsed && 'rotate-180'
            )}
          />
          {!collapsed && <span className="text-sm">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
