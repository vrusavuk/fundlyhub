/**
 * User authentication menu component
 * Handles user dropdown, sign in/out actions
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, HelpCircle, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/contexts/RBACContext';
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';
import { supabase } from '@/integrations/supabase/client';

interface UserMenuProps {
  className?: string;
  showStartFundraiser?: boolean;
  vertical?: boolean;
  onMenuAction?: () => void;
}

export function UserMenu({ 
  className, 
  showStartFundraiser = true, 
  vertical = false,
  onMenuAction 
}: UserMenuProps) {
  const { user, signOut } = useAuth();
  const { canAccessAdmin } = useRBAC();
  const { startOnboarding } = useOnboarding();

  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!user?.id) {
      setProfileAvatar(null);
      return;
    }

    // Keep header avatar consistent with the app's single source of truth: profiles.avatar
    void (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar')
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        // Non-blocking: fall back to auth metadata.
        setProfileAvatar(null);
        return;
      }

      setProfileAvatar(data?.avatar ?? null);
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const avatarSrc = useMemo(() => {
    if (!user) return null;

    const mdAvatar =
      ((user.user_metadata as any)?.avatar_url as string | undefined) ||
      ((user.user_metadata as any)?.picture as string | undefined) ||
      null;

    return profileAvatar || mdAvatar;
  }, [profileAvatar, user]);

  const handleSignOut = async () => {
    await signOut();
    onMenuAction?.();
  };

  const handleTakeTour = () => {
    startOnboarding();
    onMenuAction?.();
  };

  if (vertical) {
    // Mobile vertical layout
    return (
      <div className={`flex flex-col space-y-3 ${className || ''}`}>
        {user ? (
          <>
            <Link 
              to="/profile" 
              className="text-foreground hover:text-primary transition-smooth py-2"
              onClick={onMenuAction}
            >
              Profile
            </Link>
            {canAccessAdmin && (
              <Link 
                to="/admin" 
                className="text-foreground hover:text-primary transition-smooth py-2"
                onClick={onMenuAction}
              >
                Admin Panel
              </Link>
            )}
            <button 
              className="text-foreground hover:text-primary transition-smooth py-2 text-left"
              onClick={handleTakeTour}
            >
              Take Tour
            </button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start min-h-[44px]" 
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" className="justify-start min-h-[44px]" asChild>
            <Link to="/auth" onClick={onMenuAction}>
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Link>
          </Button>
        )}
      </div>
    );
  }

  // Desktop horizontal layout
  return (
    <div className={`flex items-center space-x-3 ${className || ''}`}>
      {showStartFundraiser && (
        <Button variant="hero" size="sm" asChild>
          <Link to="/create">Start Fundraiser</Link>
        </Button>
      )}
      
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden md:flex min-h-[44px] min-w-[44px]">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarSrc ?? undefined} alt={user.email ?? 'User avatar'} />
                <AvatarFallback>
                  {(user.user_metadata?.name as string | undefined)?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg">
            <DropdownMenuItem disabled className="gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={avatarSrc ?? undefined} alt={user.email ?? 'User avatar'} />
                <AvatarFallback className="text-xs">
                  {(user.user_metadata?.name as string | undefined)?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{(user.user_metadata?.name as string | undefined) || user.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            {canAccessAdmin && (
              <DropdownMenuItem asChild>
                <Link to="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Panel
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleTakeTour}>
              <HelpCircle className="mr-2 h-4 w-4" />
              Take Tour
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="outline" size="sm" className="hidden md:inline-flex" asChild>
          <Link to="/auth">
            <User className="h-4 w-4 mr-2" />
            Sign In
          </Link>
        </Button>
      )}
    </div>
  );
}