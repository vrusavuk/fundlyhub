import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { adminDataService } from "@/lib/services/AdminDataService";
import { AllDonorsDialog } from "@/components/fundraisers/AllDonorsDialog";
import { formatRelativeTime } from "@/lib/utils/formatters";
import { MoneyMath } from "@/lib/enterprise/utils/MoneyMath";
import { useEventSubscriber } from "@/hooks/useEventBus";

interface UserDetailsDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Complete information about {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] mt-4">
            <TabsContent value="profile" className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-lg">
                    {user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{user.name || 'No Name'}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge>{user.role}</Badge>
                    <Badge variant={user.account_status === 'active' ? 'default' : 'destructive'}>
                      {user.account_status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Campaign Count</p>
                  <p className="text-2xl font-bold">{user.campaign_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Raised</p>
                  <p className="text-2xl font-bold">${(user.total_funds_raised || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Followers</p>
                  <p className="text-2xl font-bold">{user.follower_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Following</p>
                  <p className="text-2xl font-bold">{user.following_count || 0}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Additional Information</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{user.location || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Website:</span>
                    <span>{user.website || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined:</span>
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {user.user_roles && user.user_roles.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Assigned Roles</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.user_roles.map((role: any, index: number) => (
                        <Badge key={index} variant="outline">
                          {role.role_name} ({role.context_type})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Recent Activity</h4>
                <p className="text-sm text-muted-foreground">
                  Last login: {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                </p>
                <Separator />
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Activity history feature coming soon
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Security Status</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Status:</span>
                      <Badge variant={user.account_status === 'active' ? 'default' : 'destructive'}>
                        {user.account_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">2FA Enabled:</span>
                      <Badge variant={user.twofa_enabled ? 'default' : 'secondary'}>
                        {user.twofa_enabled ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Failed Login Attempts:</span>
                      <span className={user.failed_login_attempts > 0 ? 'text-destructive font-medium' : ''}>
                        {user.failed_login_attempts || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {user.suspended_until && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2 text-destructive">Suspension Details</h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Suspended Until:</span>
                          <span>{new Date(user.suspended_until).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reason:</span>
                          <p className="mt-1">{user.suspension_reason || 'No reason provided'}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface CampaignDetailsDialogProps {
  campaign: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignDetailsDialog({ campaign, open, onOpenChange }: CampaignDetailsDialogProps) {
  const [donations, setDonations] = useState<any[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [showAllDonors, setShowAllDonors] = useState(false);

  const progress = campaign?.stats?.total_raised && campaign?.goal_amount
    ? (campaign.stats.total_raised / campaign.goal_amount) * 100
    : 0;

  const fetchDonations = async () => {
    if (!campaign?.id) return;
    
    setLoadingDonations(true);
    try {
      const donationData = await adminDataService.fetchCampaignDonations(campaign.id);
      setDonations(donationData);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoadingDonations(false);
    }
  };

  // Fetch donations when dialog opens
  useEffect(() => {
    if (open && campaign?.id) {
      fetchDonations();
    }
  }, [open, campaign?.id]);

  // Real-time updates for donations
  useEventSubscriber('donation.completed', (event) => {
    if (campaign?.id && (event.payload as any)?.fundraiserId === campaign.id) {
      console.log('[CampaignDetailsDialog] Donation completed, refreshing donors');
      fetchDonations();
    }
  });

  useEventSubscriber('donation.refunded', (event) => {
    if (campaign?.id && (event.payload as any)?.fundraiserId === campaign.id) {
      console.log('[CampaignDetailsDialog] Donation refunded, refreshing donors');
      fetchDonations();
    }
  });

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const averageDonation = donations.length > 0 ? totalDonated / donations.length : 0;
  const displayedDonations = donations.slice(0, 10);

  // Early return AFTER all hooks
  if (!campaign) {
    console.warn('[CampaignDetailsDialog] No campaign provided');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Campaign Details</DialogTitle>
          <DialogDescription>
            Complete information about "{campaign.title}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="donors">Donors ({donations.length})</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="overview" className="space-y-4">
            {campaign.cover_image && (
              <img
                src={campaign.cover_image}
                alt={campaign.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}

            <div>
              <h3 className="text-lg font-semibold">{campaign.title}</h3>
              {campaign.summary && (
                <p className="text-sm text-muted-foreground mt-1">{campaign.summary}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Badge>{campaign.status}</Badge>
              {campaign.category && <Badge variant="outline">{campaign.category}</Badge>}
              {campaign.location && <Badge variant="outline">📍 {campaign.location}</Badge>}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Goal Amount</p>
                <p className="text-2xl font-bold">
                  ${campaign.goal_amount.toLocaleString()} {campaign.currency}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Raised</p>
                <p className="text-2xl font-bold">
                  ${(campaign.stats?.total_raised || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Donors</p>
                <p className="text-2xl font-bold">{campaign.stats?.donor_count || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Progress</p>
                <p className="text-2xl font-bold">{progress.toFixed(1)}%</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Campaign Owner</h4>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={campaign.owner_profile?.avatar} />
                  <AvatarFallback>
                    {campaign.owner_profile?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{campaign.owner_profile?.name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{campaign.owner_profile?.email}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Timeline</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                </div>
                {campaign.end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date:</span>
                    <span>{new Date(campaign.end_date).toLocaleDateString()}</span>
                  </div>
                 )}
               </div>
             </div>
            </TabsContent>

            <TabsContent value="donors" className="space-y-4">
              {loadingDonations ? (
                <div className="space-y-3">
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Loading donors...</p>
                  </div>
                </div>
              ) : donations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-lg font-medium">No donations yet</p>
                  <p className="text-sm mt-1">This campaign hasn't received any donations.</p>
                </div>
              ) : (
                <>
                  {/* Summary Section */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Donors</p>
                      <p className="text-2xl font-bold">{donations.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Raised</p>
                      <p className="text-2xl font-bold">
                        {MoneyMath.format(MoneyMath.create(totalDonated, campaign.currency))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Donation</p>
                      <p className="text-2xl font-bold">
                        {MoneyMath.format(MoneyMath.create(averageDonation, campaign.currency))}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Donor List */}
                  <div className="space-y-3">
                    {displayedDonations.map((donation) => (
                      <div
                        key={donation.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={donation.donor_avatar} />
                          <AvatarFallback>
                            {donation.donor_name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">
                              {donation.donor_name}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={donation.payment_status === 'paid' ? 'default' : 'secondary'}>
                                {donation.payment_status}
                              </Badge>
                              <Badge variant="outline" className="text-primary font-semibold">
                                {MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {donation.donor_email && (
                              <span className="truncate">{donation.donor_email}</span>
                            )}
                            <span>•</span>
                            <span>{formatRelativeTime(donation.created_at)}</span>
                          </div>

                          {donation.message && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                              <p className="text-muted-foreground italic">"{donation.message}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View All Button */}
                  {donations.length > 10 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllDonors(true)}
                    >
                      View All {donations.length} Donors
                    </Button>
                  )}
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>

      {/* All Donors Dialog */}
      <AllDonorsDialog
        isOpen={showAllDonors}
        onClose={() => setShowAllDonors(false)}
        donations={donations}
        isAdminView={true}
      />
    </Dialog>
  );
}

interface OrganizationDetailsDialogProps {
  organization: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationDetailsDialog({ organization, open, onOpenChange }: OrganizationDetailsDialogProps) {
  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Organization Details</DialogTitle>
          <DialogDescription>
            Complete information about {organization.legal_name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{organization.legal_name}</h3>
              {organization.dba_name && (
                <p className="text-sm text-muted-foreground">DBA: {organization.dba_name}</p>
              )}
            </div>

            <Badge variant={organization.verification_status === 'approved' ? 'default' : 'secondary'}>
              {organization.verification_status}
            </Badge>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Members</p>
                <p className="text-2xl font-bold">{organization.member_count || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Campaigns</p>
                <p className="text-2xl font-bold">{organization.campaign_count || 0}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium">Total Raised</p>
                <p className="text-2xl font-bold">${(organization.total_raised || 0).toLocaleString()}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Organization Information</h4>
              <div className="grid gap-2 text-sm">
                {organization.ein && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EIN:</span>
                    <span>{organization.ein}</span>
                  </div>
                )}
                {organization.country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country:</span>
                    <span>{organization.country}</span>
                  </div>
                )}
                {organization.website && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Website:</span>
                    <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {organization.website}
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(organization.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {organization.categories && organization.categories.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {organization.categories.map((category: string, index: number) => (
                      <Badge key={index} variant="outline">{category}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
