/**
 * Detail Key-Value Component
 * Display key-value pairs with optional copy functionality
 */
import React from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DetailKeyValueProps {
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function DetailKeyValue({
  label,
  value,
  copyable = false,
  icon,
  className,
}: DetailKeyValueProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (typeof value === 'string') {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("flex items-start justify-between py-3 gap-4", className)}>
      <div className="flex items-center gap-2 min-w-0">
        {icon && <div className="shrink-0 text-muted-foreground">{icon}</div>}
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-muted-foreground mb-1">
            {label}
          </div>
          <div className="text-[14px] text-foreground break-words">
            {value || '—'}
          </div>
        </div>
      </div>
      {copyable && typeof value === 'string' && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-8 w-8 p-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
