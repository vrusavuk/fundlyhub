/**
 * Accessible Status Badge Component
 * Uses icons + colors (not color alone) for accessibility
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<string, { icon: any; variant: any; label: string }> = {
  active: { icon: CheckCircle, variant: 'success', label: 'Active' },
  approved: { icon: CheckCircle, variant: 'success', label: 'Approved' },
  verified: { icon: CheckCircle, variant: 'success', label: 'Verified' },
  completed: { icon: CheckCircle, variant: 'success', label: 'Completed' },
  
  pending: { icon: Clock, variant: 'warning', label: 'Pending' },
  review: { icon: Clock, variant: 'warning', label: 'Under Review' },
  scheduled: { icon: Clock, variant: 'warning', label: 'Scheduled' },
  
  rejected: { icon: XCircle, variant: 'destructive', label: 'Rejected' },
  failed: { icon: XCircle, variant: 'destructive', label: 'Failed' },
  suspended: { icon: XCircle, variant: 'destructive', label: 'Suspended' },
  banned: { icon: XCircle, variant: 'destructive', label: 'Banned' },
  deleted: { icon: XCircle, variant: 'destructive', label: 'Deleted' },
  
  draft: { icon: Minus, variant: 'secondary', label: 'Draft' },
  inactive: { icon: Minus, variant: 'secondary', label: 'Inactive' },
  closed: { icon: Minus, variant: 'secondary', label: 'Closed' },
  
  warning: { icon: AlertCircle, variant: 'warning', label: 'Warning' },
  alert: { icon: AlertCircle, variant: 'destructive', label: 'Alert' },
};

export function StatusBadge({ status, variant, showIcon = true, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const config = STATUS_CONFIG[normalizedStatus] || {
    icon: Minus,
    variant: 'outline',
    label: status
  };

  const Icon = config.icon;
  const badgeVariant = variant || config.variant;

  return (
    <Badge variant={badgeVariant} className={cn('gap-1', className)}>
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      <span>{config.label}</span>
    </Badge>
  );
}
