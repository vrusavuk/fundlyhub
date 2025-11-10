import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StripeMetricCard, MetricChange } from './StripeMetricCard';

export interface AdminStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
}

// Legacy component - just wraps StripeMetricCard
export function AdminStatsCard(props: AdminStatsCardProps) {
  const change: MetricChange | undefined = props.trend ? {
    value: typeof props.trend.value === 'number' ? props.trend.value.toString() : props.trend.value,
    isPositive: props.trend.isPositive,
    label: props.trend.label
  } : undefined;

  return (
    <StripeMetricCard
      label={props.title}
      value={props.value}
      change={change}
      className={props.className}
    />
  );
}

interface AdminStatsGridProps {
  stats: AdminStatsCardProps[];
  className?: string;
}

export function AdminStatsGrid({ stats, className }: AdminStatsGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
      className
    )}>
      {stats.map((stat, index) => {
        // Convert trend to MetricChange format if exists
        const change: MetricChange | undefined = stat.trend ? {
          value: typeof stat.trend.value === 'number' ? stat.trend.value.toString() : stat.trend.value,
          isPositive: stat.trend.isPositive,
          label: stat.trend.label || 'vs last month'
        } : undefined;

        return (
          <StripeMetricCard
            key={`stat-${index}-${stat.title}`}
            label={stat.title}
            value={stat.value}
            change={change}
            className={stat.className}
          />
        );
      })}
    </div>
  );
}