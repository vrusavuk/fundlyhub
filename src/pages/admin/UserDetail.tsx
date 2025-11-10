/**
 * User Detail Page
 * Stripe-inspired detail view for individual users
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  DetailPageLayout,
  DetailSection,
  DetailKeyValue,
  DetailTimeline,
  UserDetailSidebar,
} from '@/components/admin/detail';
import { adminDataService } from '@/lib/services/AdminDataService';
import { Skeleton } from '@/components/ui/skeleton';
import { useDetailPageBreadcrumbs } from '@/hooks/useDetailPageBreadcrumbs';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Set dynamic breadcrumbs
  useDetailPageBreadcrumbs(
    'User Management',
    '/admin/users',
    user?.name,
    loading
  );

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const userData = await adminDataService.fetchUserById(id);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        toast({
          title: 'Failed to load user',
          description: error instanceof Error ? error.message : 'User not found',
          variant: 'destructive',
        });
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const statusConfig = {
    active: { label: 'Active', variant: 'default' as const, icon: Check },
    suspended: { label: 'Suspended', variant: 'secondary' as const, icon: XCircle },
    banned: { label: 'Banned', variant: 'destructive' as const, icon: XCircle },
    deleted: { label: 'Deleted', variant: 'outline' as const, icon: XCircle },
  };

  const status = statusConfig[user.account_status as keyof typeof statusConfig] || statusConfig.active;
  const StatusIcon = status.icon;

  const timelineEvents = [
    {
      icon: <User className="h-4 w-4" />,
      title: 'Account created',
      subtitle: user.email,
      time: formatDistanceToNow(new Date(user.created_at), { addSuffix: true }),
    },
  ];

  if (user.last_login_at) {
    timelineEvents.unshift({
      icon: <Check className="h-4 w-4" />,
      title: 'Last login',
      subtitle: 'User session',
      time: formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true }),
    });
  }

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DetailPageLayout
      title={
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span>{user.name || 'Unnamed User'}</span>
        </div>
      }
      subtitle={user.email}
      status={
        <Badge variant={status.variant} className="gap-1">
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
      }
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      }
      mainContent={
        <>
          {/* Profile Information */}
          <DetailSection title="Profile Information">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <DetailKeyValue
                label="Name"
                value={user.name || 'Not set'}
              />
              <DetailKeyValue
                label="Email"
                value={user.email}
                copyable
              />
              {user.bio && (
                <div className="col-span-2">
                  <DetailKeyValue
                    label="Bio"
                    value={user.bio}
                  />
                </div>
              )}
              {user.location && (
                <DetailKeyValue
                  label="Location"
                  value={user.location}
                />
              )}
              {user.website && (
                <DetailKeyValue
                  label="Website"
                  value={
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {user.website}
                    </a>
                  }
                />
              )}
            </div>
          </DetailSection>

          {/* Account Activity */}
          <DetailSection title="Recent Activity">
            <DetailTimeline events={timelineEvents} />
          </DetailSection>

          {/* Statistics */}
          <DetailSection title="Statistics">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-[12px] text-muted-foreground mb-1">Campaigns</div>
                <div className="text-[24px] font-semibold text-foreground">
                  {user.campaign_count || 0}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-muted-foreground mb-1">Total Raised</div>
                <div className="text-[24px] font-semibold text-foreground">
                  ${Number(user.total_funds_raised || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-muted-foreground mb-1">Followers</div>
                <div className="text-[24px] font-semibold text-foreground">
                  {user.follower_count || 0}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-muted-foreground mb-1">Following</div>
                <div className="text-[24px] font-semibold text-foreground">
                  {user.following_count || 0}
                </div>
              </div>
            </div>
          </DetailSection>

          {/* Security & Account */}
          <DetailSection title="Security & Account">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <DetailKeyValue
                label="2FA Status"
                value={user.twofa_enabled ? <Badge>Enabled</Badge> : <Badge variant="outline">Disabled</Badge>}
              />
              <DetailKeyValue
                label="Email Verified"
                value={user.verified_at ? <Badge>Verified</Badge> : <Badge variant="outline">Not Verified</Badge>}
              />
              <DetailKeyValue
                label="Failed Login Attempts"
                value={user.failed_login_attempts || 0}
              />
              {user.account_locked_until && (
                <DetailKeyValue
                  label="Account Locked Until"
                  value={new Date(user.account_locked_until).toLocaleString()}
                />
              )}
            </div>
          </DetailSection>
        </>
      }
      sidebar={<UserDetailSidebar user={user} />}
    />
  );
}
