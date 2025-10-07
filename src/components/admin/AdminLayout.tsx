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

  const handleSearchFocus = () => {
    // Focus the search input in the current page
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <SmartBreadcrumb />
            </div>
            
            <div className="ml-auto px-4">
              <AdminHeader />
            </div>
          </header>
          
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Context indicator */}
            {activeContext.type !== 'global' && (
              <div className="px-3 py-2 bg-muted/50 border border-border rounded-md">
                <p className="text-sm text-foreground font-medium">
                  Context: {activeContext.type === 'organization' ? 'Organization' : 'Campaign'} 
                  {activeContext.id && ` (${activeContext.id})`}
                </p>
              </div>
            )}
            
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
              <div className="h-full p-6">
                <Outlet />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
      
      <SessionTimeoutWarning />
    </SidebarProvider>
  );
}