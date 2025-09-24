/**
 * User authentication menu component
 * Handles user dropdown, sign in/out actions
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserCircle, User, LogOut, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';

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
  const { startOnboarding } = useOnboarding();

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
              <UserCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg">
            <DropdownMenuItem disabled>
              <UserCircle className="mr-2 h-4 w-4" />
              <span className="truncate">{user.user_metadata?.name || user.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
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