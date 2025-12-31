import { Badge } from "@/components/ui/badge";
import { Crown, Users, Briefcase, User, Shield, ShieldCheck, Eye, UserX } from "lucide-react";

interface UserRoleBadgeProps {
  role: string;
  className?: string;
}

/**
 * Role configuration based on RBAC role names from the database.
 * This component is for DISPLAY ONLY - do not use for authorization.
 * For authorization checks, always use useRBAC hook.
 */
const roleConfig: Record<string, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
}> = {
  super_admin: {
    label: 'Super Admin',
    variant: 'destructive',
    icon: Crown,
  },
  platform_admin: {
    label: 'Platform Admin',
    variant: 'destructive',
    icon: Shield,
  },
  org_admin: {
    label: 'Organization Admin',
    variant: 'default',
    icon: Users,
  },
  campaign_moderator: {
    label: 'Moderator',
    variant: 'default',
    icon: ShieldCheck,
  },
  support_agent: {
    label: 'Support',
    variant: 'secondary',
    icon: ShieldCheck,
  },
  creator: {
    label: 'Creator',
    variant: 'default',
    icon: Briefcase,
  },
  user: {
    label: 'User',
    variant: 'secondary',
    icon: User,
  },
  visitor: {
    label: 'Visitor',
    variant: 'outline',
    icon: Eye,
  },
  restricted_user: {
    label: 'Restricted',
    variant: 'secondary',
    icon: UserX,
  },
  // Legacy role mappings for backward compatibility
  admin: {
    label: 'Admin',
    variant: 'destructive',
    icon: Crown,
  },
};

const defaultConfig = {
  label: 'User',
  variant: 'secondary' as const,
  icon: User,
};

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const config = roleConfig[role] || defaultConfig;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
