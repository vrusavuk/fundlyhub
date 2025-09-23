/**
 * Enhanced progress component with better visual design and accessibility
 * Provides clear labeling, improved contrast, and multiple variants
 */
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TrendingUp, Target, Calendar, Users } from 'lucide-react';

interface EnhancedProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  showAmount?: boolean;
  raisedAmount?: number;
  goalAmount?: number;
  currency?: string;
  donorCount?: number;
  daysLeft?: number;
  variant?: 'default' | 'compact' | 'detailed' | 'hero';
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'success' | 'warning' | 'destructive';
  animated?: boolean;
  className?: string;
}

export function EnhancedProgress({
  value,
  max = 100,
  label,
  showPercentage = true,
  showAmount = false,
  raisedAmount = 0,
  goalAmount = 0,
  currency = 'USD',
  donorCount,
  daysLeft,
  variant = 'default',
  size = 'md',
  color = 'default',
  animated = false,
  className
}: EnhancedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const colorClasses = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive'
  };

  const getProgressColor = () => {
    if (color !== 'default') return colorClasses[color];
    
    // Auto-assign color based on percentage
    if (percentage >= 90) return colorClasses.success;
    if (percentage >= 75) return colorClasses.default;
    if (percentage >= 50) return colorClasses.warning;
    return colorClasses.destructive;
  };

  const renderCompactVariant = () => (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        {label && <span className="font-medium text-foreground">{label}</span>}
        {showPercentage && (
          <span className="text-muted-foreground font-medium">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      
      <div className="relative">
        <Progress 
          value={percentage} 
          className={cn(sizeClasses[size], animated && "transition-all duration-1000")}
        />
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
      </div>
      
      {showAmount && goalAmount > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatAmount(raisedAmount)}</span>
          <span>{formatAmount(goalAmount)}</span>
        </div>
      )}
    </div>
  );

  const renderDetailedVariant = () => (
    <div className={cn("space-y-4 p-4 bg-muted/30 rounded-lg", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">
            {label || 'Fundraising Progress'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="font-bold text-lg text-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      <div className="relative">
        <Progress 
          value={percentage} 
          className={cn(sizeClasses[size], "bg-muted")}
        />
        <div 
          className={cn(
            "absolute top-0 left-0 h-full rounded-full transition-all duration-1000",
            getProgressColor()
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-muted-foreground">Raised</p>
          <p className="font-bold text-lg text-foreground">
            {formatAmount(raisedAmount)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">Goal</p>
          <p className="font-semibold text-foreground">
            {formatAmount(goalAmount)}
          </p>
        </div>
      </div>

      {(donorCount !== undefined || daysLeft !== undefined) && (
        <div className="flex justify-between items-center pt-2 border-t border-border text-sm">
          {donorCount !== undefined && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{donorCount} donor{donorCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {daysLeft !== undefined && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Campaign ended'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderHeroVariant = () => (
    <div className={cn("space-y-6 p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border", className)}>
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">
          {formatAmount(raisedAmount)}
        </h3>
        <p className="text-muted-foreground">
          raised of {formatAmount(goalAmount)} goal
        </p>
      </div>

      <div className="relative space-y-2">
        <Progress 
          value={percentage} 
          className="h-4 bg-muted"
        />
        <div 
          className={cn(
            "absolute top-0 left-0 h-4 rounded-full transition-all duration-1500 ease-out",
            "bg-gradient-to-r from-primary to-primary-hover shadow-md"
          )}
          style={{ width: `${percentage}%` }}
        />
        
        <div className="flex justify-between items-center text-sm font-medium">
          <span className="text-muted-foreground">0%</span>
          <span className="text-primary text-lg font-bold">
            {Math.round(percentage)}%
          </span>
          <span className="text-muted-foreground">100%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 text-center">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">Supporters</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{donorCount || 0}</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Days Left</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {daysLeft !== undefined ? Math.max(0, daysLeft) : '∞'}
          </p>
        </div>
      </div>
    </div>
  );

  // Default variant
  const renderDefaultVariant = () => (
    <div className={cn("space-y-3", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {showPercentage && (
            <span className="text-sm font-bold text-primary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <Progress 
          value={percentage} 
          className={cn(sizeClasses[size])}
        />
      </div>
      
      {showAmount && goalAmount > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-foreground">
            {formatAmount(raisedAmount)}
          </span>
          <span className="text-muted-foreground">
            of {formatAmount(goalAmount)}
          </span>
        </div>
      )}
    </div>
  );

  switch (variant) {
    case 'compact':
      return renderCompactVariant();
    case 'detailed':
      return renderDetailedVariant();
    case 'hero':
      return renderHeroVariant();
    default:
      return renderDefaultVariant();
  }
}