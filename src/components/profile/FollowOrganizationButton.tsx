import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Building, Loader2 } from 'lucide-react';
import { useFollowOrganizationEventDriven } from '@/hooks/useFollowOrganizationEventDriven';
import { useAuth } from '@/hooks/useAuth';

interface FollowOrganizationButtonProps {
  organizationId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function FollowOrganizationButton({ 
  organizationId, 
  variant = 'default', 
  size = 'default', 
  className 
}: FollowOrganizationButtonProps) {
  const { user } = useAuth();
  const { 
    isFollowing, 
    loading, 
    followOrganization, 
    unfollowOrganization, 
    checkFollowStatus 
  } = useFollowOrganizationEventDriven(organizationId);

  useEffect(() => {
    if (user && organizationId) {
      checkFollowStatus();
    }
  }, [user, organizationId, checkFollowStatus]);

  if (!user || !organizationId) {
    return null;
  }

  const handleClick = () => {
    if (isFollowing) {
      unfollowOrganization();
    } else {
      followOrganization();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={isFollowing ? 'outline' : variant}
      size={size}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <Building className="h-4 w-4 mr-2" />
      ) : (
        <Building2 className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? 'Unfollow Organization' : 'Follow Organization'}
    </Button>
  );
}