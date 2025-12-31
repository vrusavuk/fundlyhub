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
  Trash2,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  Banknote,
  Heart,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

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
        'transition-all duration-200 border-border/50 active:scale-[0.99]',
        onClick && 'cursor-pointer hover:shadow-md hover:border-border',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

// ============= User Mobile Card =============
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
  onClick?: () => void;
  onView?: (userId: string) => void;
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  showActions?: boolean;
}

export function UserMobileCard({ 
  user, 
  onClick,
  onView, 
  onEdit, 
  onDelete, 
  showActions = true 
}: UserMobileCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'suspended': return 'bg-destructive';
      case 'inactive': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  // Role variant based on hierarchy level convention (not hardcoded names)
  // This uses a simple hierarchy-based approach since we can't use hooks here
  const getRoleVariant = (role?: string): "default" | "secondary" | "destructive" | "outline" => {
    // High-privilege roles get destructive variant
    // This is a display-only concern - actual permissions are checked server-side
    if (!role) return 'outline';
    // Using includes for flexibility - actual authority comes from DB
    if (role.includes('admin')) return 'destructive';
    if (role.includes('moderator')) return 'default';
    if (role.includes('creator')) return 'secondary';
    return 'outline';
  };

  return (
    <MobileCard onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {user.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-sm truncate">{user.name || 'Unnamed User'}</h3>
              <div className={cn('w-2 h-2 rounded-full shrink-0', getStatusColor(user.account_status))} />
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant={getRoleVariant(user.role)} className="text-xs py-0 h-5">
                {user.role?.replace('_', ' ')}
              </Badge>
              {user.campaign_count !== undefined && user.campaign_count > 0 && (
                <span className="text-xs text-muted-foreground">{user.campaign_count} campaigns</span>
              )}
            </div>
          </div>
          
          {showActions && (onView || onEdit || onDelete) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(user.id); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(user.id); }}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit User
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(user.id); }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardContent>
    </MobileCard>
  );
}

// ============= Campaign Mobile Card =============
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
  onClick?: () => void;
  onView?: (campaignId: string) => void;
  onEdit?: (campaignId: string) => void;
  onDelete?: (campaignId: string) => void;
  showActions?: boolean;
}

export function CampaignMobileCard({
  campaign,
  onClick,
  onView,
  onEdit,
  onDelete,
  showActions = true
}: CampaignMobileCardProps) {
  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'paused': 
      case 'ended': 
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const progressPercentage = campaign.goal_amount 
    ? Math.min((campaign.stats?.total_raised || 0) / campaign.goal_amount * 100, 100)
    : 0;

  return (
    <MobileCard onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate flex-1">{campaign.title}</h3>
              <Badge variant={getStatusVariant(campaign.status)} className="text-xs py-0 h-5 shrink-0">
                {campaign.status}
              </Badge>
            </div>
            
            {campaign.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{campaign.summary}</p>
            )}
            
            {/* Progress bar */}
            <div className="space-y-1.5 mb-2">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground">
                  {MoneyMath.format(MoneyMath.create(campaign.stats?.total_raised || 0, campaign.currency))}
                </span>
                <span className="text-muted-foreground">
                  of {MoneyMath.format(MoneyMath.create(campaign.goal_amount || 0, campaign.currency))}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {campaign.stats?.donor_count || 0} donors
              </span>
              {campaign.category && (
                <Badge variant="outline" className="text-xs py-0 h-5">{campaign.category}</Badge>
              )}
            </div>
          </div>
          
          {showActions && (onView || onEdit || onDelete) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(campaign.id); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Campaign
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(campaign.id); }}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Campaign
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(campaign.id); }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Campaign
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
          )}
        </div>
      </CardContent>
    </MobileCard>
  );
}

// ============= Organization Mobile Card =============
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
  onClick?: () => void;
  onView?: (orgId: string) => void;
  onEdit?: (orgId: string) => void;
  onDelete?: (orgId: string) => void;
  showActions?: boolean;
}

export function OrganizationMobileCard({
  organization,
  onClick,
  onView,
  onEdit,
  onDelete,
  showActions = true
}: OrganizationMobileCardProps) {
  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <MobileCard onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-sm truncate">{organization.legal_name}</h3>
              <Badge variant={getStatusVariant(organization.verification_status)} className="text-xs py-0 h-5 shrink-0">
                {organization.verification_status}
              </Badge>
            </div>
            
            {organization.dba_name && organization.dba_name !== organization.legal_name && (
              <p className="text-xs text-muted-foreground truncate mb-1">DBA: {organization.dba_name}</p>
            )}
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{organization.member_count || 0} members</span>
              <span>{organization.campaign_count || 0} campaigns</span>
              {organization.total_raised !== undefined && organization.total_raised > 0 && (
                <span className="font-medium text-foreground">${organization.total_raised.toLocaleString()}</span>
              )}
            </div>
          </div>
          
          {showActions && (onView || onEdit || onDelete) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(organization.id); }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(organization.id); }}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Organization
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(organization.id); }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Organization
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardContent>
    </MobileCard>
  );
}

// ============= Donation Mobile Card =============
export interface DonationMobileCardProps {
  donation: {
    id: string;
    amount: number;
    currency?: string;
    payment_status: 'pending' | 'paid' | 'completed' | 'failed' | 'refunded';
    donor_name?: string;
    donor_email?: string;
    is_anonymous?: boolean;
    tip_amount?: number;
    created_at: string;
    fundraiser?: {
      title: string;
      slug?: string;
    };
    donor?: {
      name?: string;
      avatar?: string;
    };
  };
  onClick?: () => void;
}

export function DonationMobileCard({ donation, onClick }: DonationMobileCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return { icon: CheckCircle2, variant: 'default' as const, color: 'text-emerald-600' };
      case 'pending':
        return { icon: Clock, variant: 'secondary' as const, color: 'text-amber-600' };
      case 'failed':
        return { icon: XCircle, variant: 'destructive' as const, color: 'text-destructive' };
      case 'refunded':
        return { icon: AlertTriangle, variant: 'outline' as const, color: 'text-muted-foreground' };
      default:
        return { icon: Clock, variant: 'secondary' as const, color: 'text-muted-foreground' };
    }
  };

  const statusConfig = getStatusConfig(donation.payment_status);
  const StatusIcon = statusConfig.icon;
  const displayName = donation.is_anonymous ? 'Anonymous' : (donation.donor_name || donation.donor?.name || 'Unknown Donor');
  const initial = donation.is_anonymous ? 'A' : displayName.charAt(0).toUpperCase();

  return (
    <MobileCard onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            {!donation.is_anonymous && donation.donor?.avatar && (
              <AvatarImage src={donation.donor.avatar} alt={displayName} />
            )}
            <AvatarFallback className={cn(
              "text-sm font-medium",
              donation.is_anonymous ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
            )}>
              {initial}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h3 className="font-semibold text-sm truncate">{displayName}</h3>
              <span className="font-semibold text-base shrink-0">
                {MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground truncate flex-1">
                {donation.fundraiser?.title || 'Unknown Campaign'}
              </p>
              <Badge variant={statusConfig.variant} className="text-xs py-0 h-5 shrink-0">
                <StatusIcon className="h-3 w-3 mr-1" />
                {donation.payment_status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}</span>
              {donation.tip_amount !== undefined && donation.tip_amount > 0 && (
                <span className="flex items-center gap-1 text-primary">
                  <Heart className="h-3 w-3" />
                  +{MoneyMath.format(MoneyMath.create(donation.tip_amount, donation.currency))} tip
                </span>
              )}
            </div>
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </MobileCard>
  );
}

// ============= Payout Mobile Card =============
export interface PayoutMobileCardProps {
  payout: {
    id: string;
    user_id: string;
    requested_amount_str: string;
    net_amount_str: string;
    fee_amount_str?: string;
    status: string;
    priority?: string;
    risk_score?: number;
    created_at: string;
    currency?: string;
    user?: {
      name?: string;
      avatar?: string;
    };
  };
  onClick?: () => void;
}

export function PayoutMobileCard({ payout, onClick }: PayoutMobileCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return { icon: CheckCircle2, variant: 'default' as const };
      case 'pending':
        return { icon: Clock, variant: 'secondary' as const };
      case 'processing':
        return { icon: Clock, variant: 'default' as const };
      case 'denied':
        return { icon: XCircle, variant: 'destructive' as const };
      case 'info_required':
        return { icon: AlertTriangle, variant: 'outline' as const };
      default:
        return { icon: Clock, variant: 'secondary' as const };
    }
  };

  const statusConfig = getStatusConfig(payout.status);
  const StatusIcon = statusConfig.icon;

  return (
    <MobileCard onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
            <Banknote className="h-5 w-5 text-emerald-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h3 className="font-semibold text-sm">
                ${payout.requested_amount_str}
              </h3>
              <Badge variant={statusConfig.variant} className="text-xs py-0 h-5 shrink-0">
                <StatusIcon className="h-3 w-3 mr-1" />
                {payout.status.replace('_', ' ')}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground truncate">
              Net: ${payout.net_amount_str}
              {payout.fee_amount_str && ` • Fee: $${payout.fee_amount_str}`}
            </p>
            
            <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(payout.created_at), { addSuffix: true })}</span>
              {payout.risk_score !== undefined && payout.risk_score > 0 && (
                <Badge variant={payout.risk_score > 70 ? 'destructive' : 'outline'} className="text-xs py-0 h-5">
                  Risk: {payout.risk_score}
                </Badge>
              )}
            </div>
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </MobileCard>
  );
}

// ============= Platform Tip Mobile Card =============
export interface PlatformTipMobileCardProps {
  tip: {
    id: string;
    donationId: string;
    donorName: string;
    donorEmail?: string;
    campaignTitle: string;
    campaignId: string;
    creatorName: string;
    creatorId: string;
    donationAmount: number;
    tipAmount: number;
    tipPercentage: number;
    createdAt: string;
  };
  onClick?: () => void;
}

export function PlatformTipMobileCard({ tip, onClick }: PlatformTipMobileCardProps) {
  const getTipPercentageVariant = (percentage: number): "default" | "secondary" | "outline" => {
    if (percentage >= 20) return 'default';
    if (percentage >= 10) return 'secondary';
    return 'outline';
  };

  return (
    <MobileCard onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h3 className="font-semibold text-sm truncate">{tip.donorName}</h3>
              <span className="font-semibold text-base text-emerald-600 shrink-0">
                +{MoneyMath.format(MoneyMath.create(tip.tipAmount, 'USD'))}
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground truncate mb-1">
              {tip.campaignTitle}
            </p>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(tip.createdAt), { addSuffix: true })}</span>
              <div className="flex items-center gap-2">
                <span>on ${tip.donationAmount.toFixed(0)}</span>
                <Badge variant={getTipPercentageVariant(tip.tipPercentage)} className="text-xs py-0 h-5">
                  {tip.tipPercentage.toFixed(0)}%
                </Badge>
              </div>
            </div>
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </MobileCard>
  );
}