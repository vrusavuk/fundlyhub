import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useRBAC } from '@/hooks/useRBAC';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { cn } from '@/lib/utils';

function AdminLayoutContent() {
  const { state } = useSidebar();
  const breadcrumbs = useBreadcrumbs();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarInset className="flex flex-col flex-1">
      {/* Fixed header - adapts to sidebar state */}
      <header 
        className={cn(
          "fixed top-0 right-0 h-16 bg-white border-b border-border z-50",
          "flex items-center gap-2 px-4 transition-all duration-200 ease-in-out",
          isCollapsed ? "left-[3rem]" : "left-[16rem]"
        )}
      >
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <AdminBreadcrumb items={breadcrumbs} />
        
        <div className="ml-auto">
          <AdminHeader />
        </div>
      </header>
      
      {/* Main content with top padding for fixed header */}
      <main className="flex-1 flex flex-col pt-16 bg-white overflow-auto">
        <Outlet />
      </main>
    </SidebarInset>
  );
}

export function AdminLayout() {
  const { activeContext } = useRBAC();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-white">
        <AdminSidebar />
        <AdminLayoutContent />
      </div>
      
      <SessionTimeoutWarning />
    </SidebarProvider>
  );
}