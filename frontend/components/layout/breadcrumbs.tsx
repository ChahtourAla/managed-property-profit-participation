'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { ChevronRight, Slash } from 'lucide-react';

import { cn } from '@/lib/utils';
import { flatNav } from '@/lib/navigation';
import { useSession } from '@/lib/session';

type Crumb = { label: string; href: string };

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  let path = '';
  for (const segment of segments) {
    path += `/${segment}`;
    const navItem = flatNav.find((item) => item.href === path);
    const label = navItem?.title ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: path });
  }
  return crumbs;
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const { session } = useSession();
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className={cn('flex', className)}>
        <ol className="flex items-center gap-1.5 text-sm">
          <li>
            <span className="font-medium text-foreground" aria-current="page">
              {session.role}
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex', className)}>
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              <li>
                {isLast ? (
                  <span className="font-medium text-foreground" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
