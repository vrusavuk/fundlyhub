import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useRBAC } from '@/hooks/useRBAC';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

function AdminLayoutContent() {
  const breadcrumbs = useBreadcrumbs();

  return (
    <SidebarInset className="flex flex-col h-screen overflow-hidden">
      {/* Sticky header - naturally adapts to sidebar width */}
      <header className="sticky top-0 z-50 shrink-0 h-16 bg-background border-b border-border flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <AdminBreadcrumb items={breadcrumbs} />
        
        <div className="ml-auto">
          <AdminHeader />
        </div>
      </header>
      
      {/* Main content - scrolls independently */}
      <main className="flex-1 flex flex-col bg-background overflow-auto">
        <Outlet />
      </main>
    </SidebarInset>
  );
}

export function AdminLayout() {
  const { activeContext } = useRBAC();

  return (
    <SidebarProvider>
      <div className="grid grid-cols-[auto_1fr] h-screen w-full bg-background">
        <AdminSidebar />
        <AdminLayoutContent />
      </div>
      
      <SessionTimeoutWarning />
    </SidebarProvider>
  );
}