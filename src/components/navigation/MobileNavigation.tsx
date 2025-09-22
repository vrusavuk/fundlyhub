/**
 * Mobile navigation drawer component
 * Handles mobile menu with all navigation items
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { NavigationMenu } from './NavigationMenu';
import { UserMenu } from './UserMenu';
import { SearchTrigger } from './SearchTrigger';

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className={`md:hidden ${className || ''}`}>
      {/* Mobile Menu Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMenu}
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border mobile-card-spacing shadow-lg">
          <div className="container mx-auto">
            <div className="flex flex-col space-y-4">
              {/* Search Button */}
              <SearchTrigger 
                variant="button"
                onSearchOpen={closeMenu}
              />
              
              {/* Navigation Links */}
              <NavigationMenu 
                vertical 
                onNavigate={closeMenu}
              />
              
              {/* User Menu */}
              <UserMenu 
                vertical
                showStartFundraiser={false}
                onMenuAction={closeMenu}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}