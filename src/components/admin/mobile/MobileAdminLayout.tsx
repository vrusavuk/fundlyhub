import { Outlet } from 'react-router-dom';
import { MobileAdminHeader } from './MobileAdminHeader';
import { AdminLayout } from '../AdminLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider } from '@/components/ui/sidebar';

export function ResponsiveAdminLayout() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <MobileAdminHeader />
          <main className="container px-4 py-6">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return <AdminLayout />;
}