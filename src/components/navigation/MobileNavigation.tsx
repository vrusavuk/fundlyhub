/**
 * Mobile navigation drawer component
 * Handles mobile menu with all navigation items
 */
import { useState, useEffect, useRef } from 'react';
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
  const menuRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Handle keyboard navigation and focus management
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        closeMenu();
        buttonRef.current?.focus();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus trap within menu
      const menuElement = menuRef.current;
      if (menuElement) {
        const focusableElements = menuElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        firstElement?.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <div className={`md:hidden ${className || ''}`}>
      {/* Mobile Menu Button */}
      <Button 
        ref={buttonRef}
        variant="ghost" 
        size="icon" 
        onClick={toggleMenu}
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMenuOpen}
        className="min-h-[44px] min-w-[44px] touch-target"
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10"
            onClick={closeMenu}
            aria-hidden="true"
          />
          
          {/* Menu Content */}
          <nav 
            ref={menuRef}
            className="absolute top-full left-0 right-0 bg-background border-t border-border shadow-xl z-50"
            role="navigation"
            aria-label="Mobile navigation menu"
          >
            <div className="w-full px-3 sm:px-4 md:px-6">
              <div className="flex flex-col space-y-1 py-4">
                {/* Search Button */}
                <div className="py-2">
                  <SearchTrigger 
                    variant="button"
                    onSearchOpen={closeMenu}
                    className="w-full justify-start min-h-[44px] px-4"
                  />
                </div>
                
                {/* Navigation Links */}
                <div className="py-2">
                  <NavigationMenu 
                    vertical 
                    onNavigate={closeMenu}
                  />
                </div>
                
                {/* User Menu */}
                <div className="py-2 border-t border-border/50">
                  <UserMenu 
                    vertical
                    showStartFundraiser={false}
                    onMenuAction={closeMenu}
                  />
                </div>
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}