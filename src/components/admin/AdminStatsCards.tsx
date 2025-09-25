import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClasses } from '@/lib/design/typography';

interface AdminStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function AdminStatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  className,
  iconClassName 
}: AdminStatsCardProps) {
  const isImportant = typeof value === 'number' && value > 1000;
  
  return (
    <Card className={cn(
      "group relative card-enhanced transition-all duration-300 hover:shadow-medium hover:-translate-y-0.5",
      "border border-primary/10 hover:border-primary/20",
      isImportant && "ring-1 ring-primary/20",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className={cn(
          getTypographyClasses('caption', 'md', 'text-muted-foreground'),
          "uppercase tracking-wider font-semibold"
        )}>
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors",
          "border border-primary/20"
        )}>
          <Icon className={cn("h-4 w-4 text-primary", iconClassName)} />
        </div>
      </CardHeader>
      <CardContent className={getSpacingClasses('content', 'sm')}>
        <div className={cn(
          getTypographyClasses('display', 'sm', 'text-foreground'),
          "font-bold tracking-tight",
          isImportant && "bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        {description && (
          <p className={cn(
            getTypographyClasses('body', 'sm', 'text-muted-foreground'),
            "mt-1"
          )}>
            {description}
          </p>
        )}
        
        {trend && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-muted/30">
            <div className="flex items-center space-x-1">
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={cn(
                getTypographyClasses('caption', 'sm'),
                "font-semibold",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              vs last month
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AdminStatsGridProps {
  stats: AdminStatsCardProps[];
  className?: string;
}

export function AdminStatsGrid({ stats, className }: AdminStatsGridProps) {
  return (
    <div className={cn(
      "mobile-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      getSpacingClasses('component', 'lg'),
      className
    )}>
      {stats.map((stat, index) => (
        <AdminStatsCard 
          key={`stat-${index}-${stat.title}`} 
          {...stat} 
          className={cn(
            "animate-fade-in",
            // Stagger animation delays for smooth entrance
            index === 0 && "animation-delay-0",
            index === 1 && "animation-delay-100",
            index === 2 && "animation-delay-200",
            index === 3 && "animation-delay-300"
          )}
        />
      ))}
    </div>
  );
}