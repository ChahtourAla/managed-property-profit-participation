import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6',
        className
      )}
    >
      <div className="flex max-w-3xl flex-col gap-1.5">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="text-sm leading-6 text-muted-foreground text-balance sm:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2.5">{children}</div>
      )}
    </div>
  );
}
