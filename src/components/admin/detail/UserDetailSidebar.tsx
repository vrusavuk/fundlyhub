/**
 * User Detail Sidebar Component
 */
import React from 'react';
import { DetailSidebarSection } from './DetailSidebar';
import { DetailKeyValue } from './DetailKeyValue';
import { Badge } from '@/components/ui/badge';

interface UserDetailSidebarProps {
  user: any;
}

export function UserDetailSidebar({ user }: UserDetailSidebarProps) {
  const statusColors = {
    active: 'default',
    suspended: 'secondary',
    banned: 'destructive',
    deleted: 'outline',
  } as const;

  return (
    <>
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
