import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

export function AdminLayout() {
  const breadcrumbs = useBreadcrumbs();

  return (
    <SidebarProvider>
      <AdminSidebar />
      
      <SidebarInset className="flex flex-col">
        {/* Sticky header */}
        <header className="sticky top-0 z-50 shrink-0 h-16 bg-background border-b">
          <div className="flex h-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <AdminBreadcrumb items={breadcrumbs} />
            
            <div className="ml-auto">
              <AdminHeader />
            </div>
          </div>
        </header>
        
        {/* Content area - scrolls independently */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </SidebarInset>
      
      <SessionTimeoutWarning />
    </SidebarProvider>
  );
}