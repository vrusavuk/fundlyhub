import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { BreadcrumbProvider, useBreadcrumbContext } from '@/contexts/BreadcrumbContext';

function AdminLayoutContent() {
  const defaultBreadcrumbs = useBreadcrumbs();
  const { customBreadcrumbs } = useBreadcrumbContext();
  const breadcrumbs = customBreadcrumbs || defaultBreadcrumbs;

  return (
    <SidebarProvider>
      <AdminSidebar />
      
      <SidebarInset className="flex flex-col overflow-hidden">
        {/* Sticky header with proper constraints */}
        <header className="sticky top-0 z-40 shrink-0 h-16 bg-background border-b">
          <div className="flex h-full items-center gap-2 px-4 overflow-hidden">
            {/* Left section - always visible */}
            <div className="flex items-center gap-2 shrink-0">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
            </div>
            
            {/* Middle section - breadcrumb with ellipsis */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <AdminBreadcrumb items={breadcrumbs} />
            </div>
            
            {/* Right section - header actions */}
            <div className="shrink-0">
              <AdminHeader />
            </div>
          </div>
        </header>
        
        {/* Content area with proper scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </SidebarInset>
      
      <SessionTimeoutWarning />
    </SidebarProvider>
  );
}

export function AdminLayout() {
  return (
    <BreadcrumbProvider>
      <AdminLayoutContent />
    </BreadcrumbProvider>
  );
}