import { Badge } from "@/components/ui/badge";
import { Crown, Users, Briefcase, User } from "lucide-react";

interface UserRoleBadgeProps {
  role: 'visitor' | 'creator' | 'org_admin' | 'admin';
  className?: string;
}

const roleConfig = {
  visitor: {
    label: 'Visitor',
    variant: 'secondary' as const,
    icon: User,
  },
  creator: {
    label: 'Creator',
    variant: 'default' as const,
    icon: Briefcase,
  },
  org_admin: {
    label: 'Organization Admin',
    variant: 'default' as const,
    icon: Users,
  },
  admin: {
    label: 'Platform Admin',
    variant: 'destructive' as const,
    icon: Crown,
  },
};

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.visitor;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
