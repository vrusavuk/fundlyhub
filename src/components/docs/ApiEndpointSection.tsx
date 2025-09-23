/**
 * API endpoint section component for organizing related endpoints
 */
import { ReactNode } from 'react';

interface ApiEndpointSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ApiEndpointSection({ title, description, children }: ApiEndpointSectionProps) {
  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}