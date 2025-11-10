/**
 * User Profile page showing user information and campaigns
 */
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { ProfilePageSkeleton } from '@/components/skeletons/ProfilePageSkeleton';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, error } = useUserProfile(userId || '');

  // Redirect to current user's profile if accessing /profile without ID
  useEffect(() => {
    if (!userId && user) {
      navigate(`/profile/${user.id}`, { replace: true });
    }
  }, [userId, user, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <PageContainer>
          <ProfilePageSkeleton />
        </PageContainer>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <PageContainer>
          <ErrorMessage 
            message={error}
            onRetry={() => window.location.reload()}
          />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <PageContainer>
          <ErrorMessage 
            message="The user profile you're looking for doesn't exist."
            onRetry={() => navigate('/campaigns')}
          />
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer className="max-w-6xl mx-auto">
        <ScreenReaderOnly>
          <h1>Profile for {profile.name || 'User'}</h1>
        </ScreenReaderOnly>
        
        <div className="space-y-6">
          {/* Profile Header */}
          <ProfileHeader profile={profile} />

          {/* Profile Content Tabs */}
          <ProfileTabs userId={profile.id} />
        </div>
      </PageContainer>
    </AppLayout>
  );
}