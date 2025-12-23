import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Building, Loader2 } from 'lucide-react';
import { useFollowOrganization } from '@/hooks/useFollow';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

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
  const { canFollowOrganizations } = useFeatureFlags();
  const { 
    isFollowing, 
    loading, 
    follow, 
    unfollow, 
    checkFollowStatus 
  } = useFollowOrganization(organizationId);

  useEffect(() => {
    if (user && organizationId) {
      checkFollowStatus();
    }
  }, [user, organizationId, checkFollowStatus]);

  // Don't show button if not logged in or feature disabled
  if (!user || !organizationId || !canFollowOrganizations) {
    return null;
  }

  const handleClick = () => {
    if (isFollowing) {
      unfollow();
    } else {
      follow();
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