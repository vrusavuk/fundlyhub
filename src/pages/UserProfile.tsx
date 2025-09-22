/**
 * User Profile page showing user information and campaigns
 */
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';

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
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <PageContainer>
          <ErrorMessage message={error} />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <PageContainer>
          <ErrorMessage message="The user profile you're looking for doesn't exist." />
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer className="max-w-6xl mx-auto">
        {/* Smart Navigation */}
        <div className="mb-6">
          <SmartBreadcrumb />
        </div>
        
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