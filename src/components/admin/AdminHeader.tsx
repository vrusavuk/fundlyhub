import { User, LogOut, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { SearchTrigger } from '@/components/navigation/SearchTrigger';
import { KeyboardShortcutHelp } from '@/components/admin/KeyboardShortcutHelp';

export function AdminHeader() {
  const { user, signOut } = useAuth();
  const { roles, isSuperAdmin } = useRBAC();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: 'Signed out successfully',
        description: 'You have been logged out of the admin panel.',
      });
    } catch (error) {
      toast({
        title: 'Sign out failed',
        description: 'There was an error signing you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBackToSite = () => {
    navigate('/');
    toast({
      title: 'Returned to main site',
      description: 'You can access the admin panel again from your profile.',
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Search - visible on all sizes */}
      <SearchTrigger variant="icon" />
      
      {/* Keyboard Help - hidden on mobile/tablet */}
      <div className="hidden lg:block">
        <KeyboardShortcutHelp />
      </div>
      
      {/* Notifications - always visible */}
      <NotificationDropdown />
      
      {/* Back to Site - hidden on small/medium, visible on large */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleBackToSite}
        className="hidden lg:flex"
        aria-label="Return to main site"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Site
      </Button>
      
      {/* User Menu - always visible */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                  <AvatarFallback className="text-xs">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || 'Admin User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              
              {/* Role badges */}
              <div className="flex flex-wrap gap-1">
                {roles.map((role) => (
                  <Badge key={role.role_name} variant="secondary" className="text-xs">
                    {role.role_name.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Admin Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}