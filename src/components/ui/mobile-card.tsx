import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { 
  MoreHorizontal, 
  Calendar, 
  User, 
  Building2, 
  DollarSign,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Base mobile card component
interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MobileCard({ children, onClick, className }: MobileCardProps) {
  return (
    <Card 
      className={cn(
        'cursor-pointer hover:shadow-medium transition-shadow duration-200 border-primary/10',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

// User mobile card
interface UserMobileCardProps {
  user: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    role?: string;
    account_status?: string;
    created_at?: string;
    campaign_count?: number;
    total_funds_raised?: number;
    follower_count?: number;
  };
  onView?: (userId: string) => void;
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  showActions?: boolean;
}

export function UserMobileCard({ 
  user, 
  onView, 
  onEdit, 
  onDelete, 
  showActions = true 
}: UserMobileCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-red-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'platform_admin': return 'destructive';
      case 'moderator': return 'default';
      case 'creator': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <MobileCard>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-sm truncate">
                  {user.name || 'Unnamed User'}
                </h3>
                <div className={cn('w-2 h-2 rounded-full', getStatusColor(user.account_status))} />
              </div>
              
              <p className="text-xs text-muted-foreground truncate mb-2">
                {user.email}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-2">
                <Badge variant={getRoleColor(user.role)} className="text-xs">
                  {user.role?.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{user.campaign_count || 0}</div>
                  <div className="text-muted-foreground">Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">${(user.total_funds_raised || 0).toLocaleString()}</div>
                  <div className="text-muted-foreground">Raised</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{user.follower_count || 0}</div>
                  <div className="text-muted-foreground">Followers</div>
                </div>
              </div>
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(user.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(user.id)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit User
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(user.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </MobileCard>
  );
}

// Campaign mobile card
interface CampaignMobileCardProps {
  campaign: {
    id: string;
    title?: string;
    summary?: string;
    cover_image?: string;
    category?: string;
    status?: string;
    goal_amount?: number;
    currency?: string;
    created_at?: string;
    owner_profile?: {
      name?: string;
      avatar?: string;
    };
    stats?: {
      total_raised?: number;
      donor_count?: number;
    };
  };
  onView?: (campaignId: string) => void;
  onEdit?: (campaignId: string) => void;
  onDelete?: (campaignId: string) => void;
  showActions?: boolean;
}

export function CampaignMobileCard({
  campaign,
  onView,
  onEdit,
  onDelete,
  showActions = true
}: CampaignMobileCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'paused': return 'destructive';
      case 'ended': return 'outline';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const progressPercentage = campaign.goal_amount 
    ? Math.min((campaign.stats?.total_raised || 0) / campaign.goal_amount * 100, 100)
    : 0;

  return (
    <MobileCard>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-sm truncate">
                {campaign.title}
              </h3>
              <Badge variant={getStatusColor(campaign.status)} className="text-xs">
                {campaign.status}
              </Badge>
            </div>
            
            {campaign.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {campaign.summary}
              </p>
            )}
            
            {campaign.category && (
              <Badge variant="outline" className="text-xs mb-2">
                {campaign.category}
              </Badge>
            )}
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(campaign.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Campaign
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(campaign.id)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Campaign
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(campaign.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Campaign
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs">
            <span className="font-medium">
              {MoneyMath.format(MoneyMath.create(campaign.stats?.total_raised || 0, campaign.currency))}
            </span>
            <span className="text-muted-foreground">
              of {MoneyMath.format(MoneyMath.create(campaign.goal_amount || 0, campaign.currency))}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{campaign.stats?.donor_count || 0} donors</span>
            </div>
            {campaign.owner_profile?.name && (
              <div className="flex items-center space-x-1">
                <span>by {campaign.owner_profile.name}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </MobileCard>
  );
}

// Organization mobile card
interface OrganizationMobileCardProps {
  organization: {
    id: string;
    legal_name?: string;
    dba_name?: string;
    verification_status?: string;
    created_at?: string;
    member_count?: number;
    campaign_count?: number;
    total_raised?: number;
  };
  onView?: (orgId: string) => void;
  onEdit?: (orgId: string) => void;
  onDelete?: (orgId: string) => void;
  showActions?: boolean;
}

export function OrganizationMobileCard({
  organization,
  onView,
  onEdit,
  onDelete,
  showActions = true
}: OrganizationMobileCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <MobileCard>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-sm truncate">
                  {organization.legal_name}
                </h3>
                <Badge variant={getStatusColor(organization.verification_status)} className="text-xs">
                  {organization.verification_status}
                </Badge>
              </div>
              
              {organization.dba_name && organization.dba_name !== organization.legal_name && (
                <p className="text-xs text-muted-foreground truncate mb-2">
                  DBA: {organization.dba_name}
                </p>
              )}
              
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                <div className="text-center">
                  <div className="font-medium">{organization.member_count || 0}</div>
                  <div className="text-muted-foreground">Members</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{organization.campaign_count || 0}</div>
                  <div className="text-muted-foreground">Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">${(organization.total_raised || 0).toLocaleString()}</div>
                  <div className="text-muted-foreground">Raised</div>
                </div>
              </div>
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(organization.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(organization.id)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Organization
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(organization.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Organization
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </MobileCard>
  );
}