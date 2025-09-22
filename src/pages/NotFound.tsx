import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AppLayout>
      <PageContainer maxWidth="md">
        <div className="text-center">
          <PageHeader
            title="404"
            description="Oops! Page not found"
            showBreadcrumbs={false}
          />
          <Button asChild size="lg" className="mt-6">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
};

export default NotFound;
