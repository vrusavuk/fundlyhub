import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FollowButton } from '@/components/profile/FollowButton';
import { FollowOrganizationButton } from '@/components/profile/FollowOrganizationButton';
import { MapPin, Calendar, Verified } from 'lucide-react';
import type { Fundraiser } from '@/types/fundraiser-detail';

interface FundraiserHeroProps {
  fundraiser: Fundraiser;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function FundraiserHero({ fundraiser }: FundraiserHeroProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Image */}
      <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
        <img
          src={fundraiser.cover_image}
          alt={fundraiser.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title and Info */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Badge variant="secondary" className="flex items-center gap-1">
            {fundraiser.category}
          </Badge>
          {fundraiser.location && (
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {fundraiser.location}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created {formatDate(fundraiser.created_at)}
          </Badge>
        </div>
        
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
          {fundraiser.title}
        </h1>
        
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {fundraiser.summary}
        </p>
        
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Campaign Organizer - Clickable */}
          <Link 
            to={`/profile/${fundraiser.owner_user_id}`}
            className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 transition-colors group"
          >
            <Avatar className="h-12 w-12 group-hover:scale-105 transition-transform">
              <AvatarFallback>{fundraiser.profiles?.name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium group-hover:text-primary transition-colors">
                  {fundraiser.profiles?.name || 'Anonymous'}
                </span>
                <Badge variant="outline" className="text-xs">
                  <Verified className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">Organizer</span>
            </div>
          </Link>

          {/* Follow Campaign Organizer Button */}
          {fundraiser.owner_user_id && (
            <FollowButton 
              userId={fundraiser.owner_user_id} 
              size="sm"
              variant="outline"
            />
          )}

          {/* Organization Info & Follow Button - Clickable */}
          {fundraiser.organizations && (
            <>
              <Link 
                to={`/organization/${fundraiser.organizations.id}`}
                className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 transition-colors group"
              >
                <Avatar className="h-10 w-10 group-hover:scale-105 transition-transform">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {fundraiser.organizations.dba_name?.charAt(0) || fundraiser.organizations.legal_name?.charAt(0) || 'O'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">
                      {fundraiser.organizations.dba_name || fundraiser.organizations.legal_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Organization
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">Supporting this cause</span>
                </div>
              </Link>
              
              <FollowOrganizationButton 
                organizationId={fundraiser.organizations.id}
                size="sm"
                variant="outline"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}