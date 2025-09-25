import { Menu, Search, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from '../AdminSidebar';
import { useRBAC } from '@/hooks/useRBAC';

export function MobileAdminHeader() {
  const { getHighestRole } = useRBAC();
  const highestRole = getHighestRole();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="container flex h-14 items-center px-4">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="mr-2 px-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <AdminSidebar />
          </SheetContent>
        </Sheet>

        {/* Title */}
        <div className="flex-1 flex items-center space-x-2">
          <div className="flex-shrink-0 w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <div className="w-3 h-3 bg-primary-foreground rounded-sm" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">
              Admin Panel
            </h1>
            {highestRole && (
              <Badge variant="secondary" className="text-xs">
                {highestRole.role_name.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="px-2">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="px-2 relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
            <span className="sr-only">Notifications</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="px-2">
            <User className="h-4 w-4" />
            <span className="sr-only">Profile</span>
          </Button>
        </div>
      </div>
    </header>
  );
}