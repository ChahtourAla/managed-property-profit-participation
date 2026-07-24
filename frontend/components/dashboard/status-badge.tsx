import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const statusVariant: Record<
  string,
  { className: string; dot: string }
> = {
  Draft: {
    className: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
  Owner: {
    className: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
  },
  Investor: {
    className: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
  },
  Approved: {
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  Subscribed: {
    className: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
  },
  'Owner confirmation pending': {
    className: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  'Owner confirmed': {
    className: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
  },
  Validated: {
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  'Token instrument created': {
    className: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
  },
  'Subscription open': {
    className: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
  },
  'Funding pending': {
    className: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  Funded: {
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  Active: {
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  'Tokens issued': {
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  'Performance reporting': {
    className: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  Reconciled: {
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  'Reward distributed': {
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  'Reward pending': {
    className: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  Completed: {
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  Paid: {
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  Closed: {
    className: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
  'Tokens redeemed or burned': {
    className: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
  'Tokens redeemed/burned': {
    className: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
  Rejected: {
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    dot: 'bg-destructive',
  },
  Accepted: {
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  Pending: {
    className: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  Processing: {
    className: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  Listed: {
    className: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
  },
  'Under Review': {
    className: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  'Off Market': {
    className: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
  Withdrawn: {
    className: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  },
  Failed: {
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    dot: 'bg-destructive',
  },
};

export function StatusBadge({ status }: { status: string }) {
  const variant = statusVariant[status] ?? {
    className: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  };

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 font-medium', variant.className)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', variant.dot)} />
      {status}
    </Badge>
  );
}
