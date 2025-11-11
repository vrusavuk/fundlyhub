import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'success' | 'warning' | 'error';
  icon?: LucideIcon;
}

export function MetricCard({
  title,
  value,
  description,
  trend = 'stable',
  status = 'success',
  icon: Icon,
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendColor = () => {
    if (trend === 'stable') return 'text-muted-foreground';
    if (status === 'success') {
      return trend === 'down' ? 'text-success' : 'text-muted-foreground';
    }
    return trend === 'up' ? 'text-destructive' : 'text-success';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className={cn("h-4 w-4", getStatusColor())} />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{value}</div>
          <Badge
            variant="outline"
            className={cn(
              'flex items-center gap-1 px-2 py-1',
              getTrendColor()
            )}
          >
            {getTrendIcon()}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
