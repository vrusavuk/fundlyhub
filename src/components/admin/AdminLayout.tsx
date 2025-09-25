import { Outlet } from 'react-router-dom';
import { ProAdminSidebar } from './ProAdminSidebar';
import { AdminHeader } from './AdminHeader';
import { KeyboardShortcuts } from '@/components/admin/KeyboardShortcuts';
import { useRBAC } from '@/hooks/useRBAC';
import { Toaster } from '@/components/ui/toaster';
import { useSidebarState } from '@/hooks/useSidebarState';

export function AdminLayout() {
  const { activeContext } = useRBAC();
  const { collapsed, toggle } = useSidebarState();

  const handleSearchFocus = () => {
    // Focus the search input in the current page
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  };

  // Handle keyboard shortcut for toggling sidebar
  const handleKeyboardToggle = () => {
    toggle();
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <ProAdminSidebar collapsed={collapsed} onToggle={toggle} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Context indicator */}
            {activeContext.type !== 'global' && (
              <div className="mb-4 px-3 py-2 bg-muted/50 border border-border rounded-md">
                <p className="text-sm text-foreground font-medium">
                  Context: {activeContext.type === 'organization' ? 'Organization' : 'Campaign'} 
                  {activeContext.id && ` (${activeContext.id})`}
                </p>
              </div>
            )}
            
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Global Keyboard Shortcuts */}
      <KeyboardShortcuts 
        onSearchFocus={handleSearchFocus} 
        onSidebarToggle={handleKeyboardToggle}
      />
      
      <Toaster />
    </div>
  );
}