import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useRBAC } from '@/hooks/useRBAC';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

export function AdminLayout() {
  const { activeContext } = useRBAC();
  const breadcrumbs = useBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <AdminSidebar />
        
        <SidebarInset className="flex flex-col flex-1">
          {/* Sticky header - stays at top while scrolling, no overlap */}
          <header className="sticky top-0 z-50 h-16 bg-white border-b border-border flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <AdminBreadcrumb items={breadcrumbs} />
            
            <div className="ml-auto">
              <AdminHeader />
            </div>
          </header>
          
          {/* Main content - header is in natural flow */}
          <main className="flex-1 flex flex-col bg-white overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      
      <SessionTimeoutWarning />
    </SidebarProvider>
  );
}