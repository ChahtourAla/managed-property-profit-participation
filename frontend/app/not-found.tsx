import Link from 'next/link';
import { Home, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <span className="text-[120px] font-bold leading-none tracking-tighter text-muted-foreground/15 sm:text-[160px]">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="text-[120px] font-bold leading-none tracking-tighter sm:text-[160px]">
              404
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Page not found
          </h1>
          <p className="max-w-md text-sm text-muted-foreground text-balance">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/dashboard/marketplace">
              <Search className="h-4 w-4" />
              Browse marketplace
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
