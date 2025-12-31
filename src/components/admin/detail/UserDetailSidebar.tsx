/**
 * User Detail Sidebar Component
 */
import React from 'react';
import { DetailSidebarSection } from './DetailSidebar';
import { DetailKeyValue } from './DetailKeyValue';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

interface UserRole {
  role_id: string;
  roles: {
    name: string;
    display_name: string;
    hierarchy_level: number;
  };
}

interface UserDetailSidebarProps {
  user: any;
}

const getHierarchyBadgeVariant = (level: number) => {
  if (level >= 90) return 'destructive';
  if (level >= 70) return 'default';
  if (level >= 50) return 'secondary';
  return 'outline';
};

export function UserDetailSidebar({ user }: UserDetailSidebarProps) {
  const statusColors = {
    active: 'default',
    suspended: 'secondary',
    banned: 'destructive',
    deleted: 'outline',
  } as const;

  // Extract roles from user data (RBAC - single source of truth)
  const userRoles: UserRole[] = user.user_role_assignments || [];

  // Show "No roles assigned" message if no RBAC roles exist
  const hasRoles = userRoles.length > 0;

  return (
    <>
      {/* Roles Section - Always show, even if empty */}
      <DetailSidebarSection title="Roles">
        <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-xs">Assigned Roles</span>
        </div>
        {hasRoles ? (
          <div className="flex flex-wrap gap-1.5">
            {userRoles.map((assignment) => (
              <Badge 
                key={assignment.role_id}
                variant={getHierarchyBadgeVariant(assignment.roles?.hierarchy_level || 0) as any}
                className="text-xs"
              >
                {assignment.roles?.display_name || assignment.roles?.name || 'Unknown'}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No roles assigned</p>
        )}
      </DetailSidebarSection>

      {/* User Details */}
      <DetailSidebarSection title="Details">
        <DetailKeyValue
          label="User ID"
          value={user.id}
          copyable
        />
        <DetailKeyValue
          label="Email"
          value={user.email}
          copyable
        />
        <DetailKeyValue
          label="Account Status"
          value={
            <Badge variant={statusColors[user.account_status as keyof typeof statusColors] || 'default'}>
              {user.account_status}
            </Badge>
          }
        />
        <DetailKeyValue
          label="Profile Visibility"
          value={user.profile_visibility || 'public'}
        />
      </DetailSidebarSection>

      {/* Account Info */}
      <DetailSidebarSection title="Account Info">
        <DetailKeyValue
          label="Joined"
          value={new Date(user.created_at).toLocaleDateString()}
        />
        {user.last_login_at && (
          <DetailKeyValue
            label="Last Login"
            value={new Date(user.last_login_at).toLocaleDateString()}
          />
        )}
        {user.verified_at && (
          <DetailKeyValue
            label="Verified"
            value={<Badge variant="default">Verified</Badge>}
          />
        )}
        {user.twofa_enabled && (
          <DetailKeyValue
            label="2FA"
            value={<Badge variant="default">Enabled</Badge>}
          />
        )}
      </DetailSidebarSection>

      {/* Activity Stats */}
      <DetailSidebarSection title="Activity">
        <DetailKeyValue
          label="Campaigns Created"
          value={user.campaign_count || 0}
        />
        <DetailKeyValue
          label="Total Raised"
          value={`$${Number(user.total_funds_raised || 0).toLocaleString()}`}
        />
        <DetailKeyValue
          label="Followers"
          value={user.follower_count || 0}
        />
        <DetailKeyValue
          label="Following"
          value={user.following_count || 0}
        />
      </DetailSidebarSection>
    </>
  );
}
