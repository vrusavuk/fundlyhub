import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollowUserEventDriven } from '@/hooks/useFollowUserEventDriven';
import { useAuth } from '@/hooks/useAuth';

interface FollowButtonProps {
  userId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function FollowButton({ userId, variant = 'default', size = 'default', className }: FollowButtonProps) {
  const { user } = useAuth();
  const { isFollowing, loading, followUser, unfollowUser, checkFollowStatus } = useFollowUserEventDriven(userId);

  useEffect(() => {
    if (user && user.id !== userId) {
      checkFollowStatus();
    }
  }, [user, userId, checkFollowStatus]);

  if (!user || user.id === userId) {
    return null;
  }

  const handleClick = () => {
    if (isFollowing) {
      unfollowUser();
    } else {
      followUser();
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
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}