/**
 * Accessibility-enhanced card component
 * Provides proper landmarks and navigation support
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AccessibleCardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  role?: 'article' | 'region' | 'complementary';
  labelledBy?: string;
  describedBy?: string;
  tabIndex?: number;
  onClick?: () => void;
  interactive?: boolean;
}

export function AccessibleCard({
  title,
  description,
  children,
  className,
  role = 'article',
  labelledBy,
  describedBy,
  tabIndex,
  onClick,
  interactive = false,
  ...props
}: AccessibleCardProps) {
  const cardProps = {
    role,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    tabIndex: interactive ? (tabIndex ?? 0) : undefined,
    onClick: interactive ? onClick : undefined,
    onKeyDown: interactive ? (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && onClick) {
        e.preventDefault();
        onClick();
      }
    } : undefined,
  };

  return (
    <Card 
      className={cn(
        interactive && 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
      {...cardProps}
      {...props}
    >
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle id={labelledBy} className="text-foreground">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription id={describedBy} className="text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      {children && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
}