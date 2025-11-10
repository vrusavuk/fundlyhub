import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useRBAC } from '@/hooks/useRBAC';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

export function AdminLayout() {
  const { activeContext } = useRBAC();
  
  // Initialize breadcrumbs for admin pages
  useBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <SidebarInset className="flex flex-col flex-1 bg-[#F6F9FC]">
          {/* Sticky white header with navigation */}
          <header className="flex h-16 shrink-0 items-center gap-2 bg-white border-b border-[#E3E8EE] sticky top-0 z-10">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <SmartBreadcrumb />
            </div>
            
            <div className="ml-auto px-4">
              <AdminHeader />
            </div>
          </header>
          
          {/* Main content wrapper with proper flex and background */}
          <main className="flex-1 flex flex-col min-h-0">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      
      <SessionTimeoutWarning />
    </SidebarProvider>
  );
}