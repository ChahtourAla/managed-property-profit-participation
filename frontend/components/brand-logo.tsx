import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src="/images/logo-menzel.png"
        alt="Menzel"
        width={220}
        height={130}
        priority
        className={cn(
          'object-contain object-center',
          compact ? 'h-10 w-10' : 'h-14 w-auto max-w-[12rem]',
        )}
      />
    </div>
  );
}
