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
      <div className="grid grid-cols-[auto_1fr] h-screen w-full bg-background">
        <AdminSidebar />
        
        <SidebarInset className="flex flex-col h-screen">
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
      </div>
      
      <SessionTimeoutWarning />
    </SidebarProvider>
  );
}