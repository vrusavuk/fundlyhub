import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatItem {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: LucideIcon;
  description?: string;
  color?: 'default' | 'success' | 'warning' | 'destructive';
}

interface MobileStatsGridProps {
  stats: StatItem[];
  loading?: boolean;
}

export function MobileStatsGrid({ stats, loading = false }: MobileStatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-2 bg-muted rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getColorClasses = (color: StatItem['color']) => {
    switch (color) {
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'destructive':
        return 'border-destructive/20 bg-destructive/5';
      default:
        return 'border-border bg-card';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <Card key={index} className={getColorClasses(stat.color)}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {stat.title}
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                stat.color === 'success' ? 'bg-success/10' :
                stat.color === 'warning' ? 'bg-warning/10' :
                stat.color === 'destructive' ? 'bg-destructive/10' :
                'bg-primary/10'
              }`}>
                <stat.icon className={`h-4 w-4 ${
                  stat.color === 'success' ? 'text-success' :
                  stat.color === 'warning' ? 'text-warning' :
                  stat.color === 'destructive' ? 'text-destructive' :
                  'text-primary'
                }`} />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              {stat.change && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getTrendColor(stat.change.trend)}`}
                >
                  {stat.change.value}
                </Badge>
              )}
              
              {stat.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {stat.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}