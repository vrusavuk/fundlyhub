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
  StripeTable,
  StripeTableHeader,
  StripeTableBody,
  StripeTableHead,
  StripeTableRow,
  StripeTableCell,
} from '@/components/ui/stripe-table';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
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
  const [donations, setDonations] = useState<any[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(true);

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

  useEffect(() => {
    const fetchDonations = async () => {
      if (!id) return;
      
      try {
        setDonationsLoading(true);
        const donationData = await adminDataService.fetchUserDonations(id);
        setDonations(donationData);
      } catch (error) {
        console.error('Error fetching user donations:', error);
      } finally {
        setDonationsLoading(false);
      }
    };

    if (user) {
      fetchDonations();
    }
  }, [id, user]);

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'stripe-success';
      case 'pending':
        return 'stripe-warning';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'stripe-neutral';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Succeeded';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
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

          {/* Donation History */}
          <DetailSection 
            title="Donation History" 
            actions={
              donations.length > 0 && (
                <span className="text-[12px] text-muted-foreground">
                  {donations.length} total donation{donations.length !== 1 ? 's' : ''}
                </span>
              )
            }
          >
            {donationsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[14px] text-muted-foreground">
                  No donations yet
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <StripeTable>
                  <StripeTableHeader>
                    <StripeTableRow density="comfortable">
                      <StripeTableHead>Amount</StripeTableHead>
                      <StripeTableHead>Campaign</StripeTableHead>
                      <StripeTableHead>Status</StripeTableHead>
                      <StripeTableHead>Date</StripeTableHead>
                      <StripeTableHead className="text-right">Actions</StripeTableHead>
                    </StripeTableRow>
                  </StripeTableHeader>
                  <StripeTableBody>
                    {donations.map((donation) => (
                      <StripeTableRow 
                        key={donation.id}
                        density="comfortable"
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/donations/${donation.id}`)}
                      >
                        <StripeTableCell>
                          <span className="font-medium">
                            {MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))}
                          </span>
                        </StripeTableCell>
                        <StripeTableCell>
                          {donation.fundraisers?.title || 'Unknown Campaign'}
                        </StripeTableCell>
                        <StripeTableCell>
                          <Badge variant={getStatusVariant(donation.payment_status) as any}>
                            {getStatusLabel(donation.payment_status)}
                          </Badge>
                        </StripeTableCell>
                        <StripeTableCell>
                          {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
                        </StripeTableCell>
                        <StripeTableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/donations/${donation.id}`);
                            }}
                          >
                            View
                          </Button>
                        </StripeTableCell>
                      </StripeTableRow>
                    ))}
                  </StripeTableBody>
                </StripeTable>
              </div>
            )}
          </DetailSection>
        </>
      }
      sidebar={<UserDetailSidebar user={user} />}
    />
  );
}
