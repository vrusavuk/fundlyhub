import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useRBAC } from '@/hooks/useRBAC';
import { Toaster } from '@/components/ui/toaster';

export function AdminLayout() {
  const { activeContext } = useRBAC();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-h-screen">
          <AdminHeader />
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {/* Context indicator */}
              {activeContext.type !== 'global' && (
                <div className="mb-4 px-3 py-2 bg-primary/10 border border-primary/20 rounded-md">
                  <p className="text-sm text-primary font-medium">
                    Context: {activeContext.type === 'organization' ? 'Organization' : 'Campaign'} 
                    {activeContext.id && ` (${activeContext.id})`}
                  </p>
                </div>
              )}
              
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}