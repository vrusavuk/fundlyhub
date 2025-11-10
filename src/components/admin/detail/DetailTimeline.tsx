/**
 * Detail Timeline Component
 * Display activity timeline for detail pages
 */
import React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineEvent {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  time: string;
}

interface DetailTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function DetailTimeline({ events, className }: DetailTimelineProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {events.map((event, index) => (
        <div key={index} className="flex gap-3">
          {/* Icon with connecting line */}
          <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              {event.icon}
            </div>
            {index < events.length - 1 && (
              <div className="w-px h-full bg-border absolute top-8" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pt-1 pb-4">
            <div className="text-[14px] font-medium text-foreground">
              {event.title}
            </div>
            {event.subtitle && (
              <div className="text-[13px] text-muted-foreground mt-1">
                {event.subtitle}
              </div>
            )}
            <div className="text-[12px] text-muted-foreground mt-1">
              {event.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
