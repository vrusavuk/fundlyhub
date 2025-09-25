import { Bell, Search, Settings, User, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useRBAC } from '@/hooks/useRBAC';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClasses } from '@/lib/design/typography';

interface EnhancedAdminHeaderProps {
  className?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
}

export function EnhancedAdminHeader({ 
  className, 
  showSearch = false,
  searchPlaceholder = "Search admin panel...",
  onSearchChange 
}: EnhancedAdminHeaderProps) {
  const { isSuperAdmin, getHighestRole } = useRBAC();
  const { user, signOut } = useAuth();
  const highestRole = getHighestRole();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border",
      "shadow-soft",
      className
    )}>
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="hover:bg-muted/50" />
          
          {showSearch && (
            <div className="relative w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-10 h-9 shadow-minimal border-border focus:border-muted-foreground/30"
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative hover:bg-muted/50">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
          </Button>

          {/* Help */}
          <Button variant="ghost" size="sm" className="hover:bg-muted/50">
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted/50">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="Admin" />
                  <AvatarFallback className="bg-muted text-foreground font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              className="w-64 shadow-elevated bg-background/95 backdrop-blur-sm border-border" 
              align="end" 
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className={getSpacingClasses('content', 'sm')}>
                  <p className={getTypographyClasses('body', 'md', 'text-foreground')}>
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <p className={getTypographyClasses('caption', 'md', 'text-muted-foreground')}>
                    {user?.email}
                  </p>
                  {highestRole && (
                    <Badge 
                      variant={isSuperAdmin() ? 'destructive' : 'secondary'} 
                      className="text-xs mt-2"
                    >
                      {highestRole.role_name.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="hover:bg-muted/50">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="hover:bg-muted/50">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}