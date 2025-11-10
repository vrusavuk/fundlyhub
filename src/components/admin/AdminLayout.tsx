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
      <div className="min-h-screen flex w-full bg-[#F6F9FC]">
        <AdminSidebar />
        
        <SidebarInset className="bg-[#F6F9FC]">
          <header className="flex h-16 shrink-0 items-center gap-2 bg-white border-b border-[#E3E8EE]">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <SmartBreadcrumb />
            </div>
            
            <div className="ml-auto px-4">
              <AdminHeader />
            </div>
          </header>
          
          {/* Context indicator */}
          {activeContext.type !== 'global' && (
            <div className="mx-6 mt-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-900 font-medium">
                Context: {activeContext.type === 'organization' ? 'Organization' : 'Campaign'} 
                {activeContext.id && ` (${activeContext.id})`}
              </p>
            </div>
          )}
          
          <Outlet />
        </SidebarInset>
      </div>
      
      <SessionTimeoutWarning />
    </SidebarProvider>
  );
}