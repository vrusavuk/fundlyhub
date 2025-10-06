import { Badge } from '@/components/ui/badge';
import { Globe, Link2, Lock } from 'lucide-react';

interface VisibilityBadgeProps {
  visibility: 'public' | 'unlisted' | 'private';
}

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const config = {
    public: {
      label: 'Public',
      icon: Globe,
      variant: 'default' as const,
    },
    unlisted: {
      label: 'Unlisted',
      icon: Link2,
      variant: 'secondary' as const,
    },
    private: {
      label: 'Private',
      icon: Lock,
      variant: 'outline' as const,
    },
  };

  const { label, icon: Icon, variant } = config[visibility];

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}
