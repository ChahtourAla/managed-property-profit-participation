'use client';

import * as React from 'react';
import { Bell, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { notifications as defaultNotifications } from '@/lib/mock-user';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

const typeStyles: Record<string, string> = {
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-destructive/10 text-destructive',
};

export function NotificationDropdown() {
  const [items, setItems] = React.useState(defaultNotifications);
  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0 sm:w-96"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Check className="h-3 w-3" />
            Mark all read
          </button>
        </div>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="h-[320px]">
          <div className="flex flex-col">
            {items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex gap-3 border-b border-border/50 px-4 py-3 transition-colors hover:bg-accent/50',
                  !n.read && 'bg-accent/30'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    typeStyles[n.type]
                  )}
                >
                  <Bell className="h-4 w-4" />
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {n.description}
                  </p>
                  <span className="mt-0.5 text-xs text-muted-foreground/70">
                    {n.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem className="justify-center py-2.5 text-sm font-medium">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
