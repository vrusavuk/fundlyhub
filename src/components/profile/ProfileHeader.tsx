import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Globe, Calendar, Users, Heart } from 'lucide-react';
import { FollowButton } from './FollowButton';
import { UserRoleBadge } from '@/components/user/UserRoleBadge';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  role: string;
  campaign_count: number;
  total_funds_raised: number;
  follower_count: number;
  following_count: number;
  created_at: string;
}

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const joinDate = format(new Date(profile.created_at), 'MMMM yyyy');

  return (
    <Card className="border-0 shadow-none bg-gradient-subtle">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar || undefined} alt={profile.name || 'User'} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-primary text-primary-foreground">
                {profile.name?.charAt(0)?.toUpperCase() || profile.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {profile.name || 'Anonymous User'}
              </h1>
              // SECURITY WARNING: profile.role is for display only
              // For authorization checks, always use useRBAC hook and RBAC functions
              <UserRoleBadge 
                role={profile.role as 'visitor' | 'creator' | 'org_admin' | 'admin'} 
                className="mt-2"
              />
            </div>
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-4">
            {/* Bio */}
            {profile.bio && (
              <p className="text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {joinDate}</span>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-lg text-foreground">{profile.campaign_count}</div>
                  <div className="text-muted-foreground">Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-foreground">
                    {MoneyMath.format(MoneyMath.create(profile.total_funds_raised, 'USD'))}
                  </div>
                  <div className="text-muted-foreground">Raised</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {profile.follower_count}
                  </div>
                  <div className="text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-foreground flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {profile.following_count}
                  </div>
                  <div className="text-muted-foreground">Following</div>
                </div>
              </div>

              {/* Follow Button */}
              <FollowButton userId={profile.id} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}