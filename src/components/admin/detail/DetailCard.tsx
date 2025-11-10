/**
 * Detail Card Component
 * Simple card wrapper for grouped information
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface DetailCardProps {
  children: React.ReactNode;
  className?: string;
}

export function DetailCard({ children, className }: DetailCardProps) {
  return (
    <div className={cn(
      "bg-card border border-border rounded-lg px-6 py-5",
      className
    )}>
      {children}
    </div>
  );
}
