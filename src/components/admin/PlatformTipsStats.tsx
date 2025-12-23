/**
 * Platform Tips Stats Component
 * Reusable stats cards for displaying platform tips data
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Percent, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import type { PlatformTipsStats } from '@/lib/services/platformTips.service';

interface PlatformTipsStatsProps {
  stats: PlatformTipsStats | null;
  loading?: boolean;
  variant?: 'dashboard' | 'full';
}

export function PlatformTipsStatsCards({ stats, loading, variant = 'dashboard' }: PlatformTipsStatsProps) {
  if (loading) {
    return (
      <div className={`grid gap-4 ${variant === 'full' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
        {Array.from({ length: variant === 'full' ? 5 : 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return MoneyMath.format(MoneyMath.create(amount, 'USD'));
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const cards = [
    {
      title: 'Total Tips',
      value: formatCurrency(stats?.totalTips || 0),
      description: 'Lifetime platform tips',
      icon: Heart,
      iconColor: 'text-rose-500',
    },
    {
      title: 'Tip Adoption',
      value: formatPercentage(stats?.tipAdoptionRate || 0),
      description: 'Of donations include tips',
      icon: TrendingUp,
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Avg Tip %',
      value: formatPercentage(stats?.averageTipPercentage || 0),
      description: 'Average tip percentage',
      icon: Percent,
      iconColor: 'text-blue-500',
    },
    {
      title: 'Tips MTD',
      value: formatCurrency(stats?.tipsThisMonth || 0),
      description: 'Month to date',
      icon: Calendar,
      iconColor: 'text-amber-500',
    },
  ];

  // Add average tip amount for full variant
  if (variant === 'full') {
    cards.push({
      title: 'Avg Tip Amount',
      value: formatCurrency(stats?.averageTipAmount || 0),
      description: 'Per donation with tip',
      icon: DollarSign,
      iconColor: 'text-purple-500',
    });
  }

  return (
    <div className={`grid gap-4 ${variant === 'full' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
