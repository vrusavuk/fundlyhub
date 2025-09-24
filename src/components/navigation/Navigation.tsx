/**
 * Navigation component using composition pattern
 * Combines smaller focused components for better maintainability
 */
import { useGlobalSearch } from '@/contexts/UnifiedSearchContext';
import { HeaderSearch } from '@/components/search/HeaderSearch';
import { BrandLogo } from './BrandLogo';
import { NavigationMenu } from './NavigationMenu';
import { UserMenu } from './UserMenu';
import { SearchTrigger } from './SearchTrigger';
import { MobileNavigation } from './MobileNavigation';

export function Navigation() {
  const { isHeaderSearchOpen, closeHeaderSearch } = useGlobalSearch();

  return (
    <>
      <HeaderSearch isOpen={isHeaderSearchOpen} onClose={closeHeaderSearch} />
      
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border relative">
        <div className="w-full px-3 sm:px-4 md:px-6">
          <div className="flex items-center h-14 sm:h-16">
            
            {/* Brand Logo - Left Edge */}
            <div className="flex-shrink-0">
              <BrandLogo />
            </div>

            {/* Desktop Navigation Menu - Center */}
            <div className="flex-1 flex justify-center">
              <NavigationMenu />
            </div>

            {/* Action Buttons - Right Edge */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {/* Search Trigger */}
              <SearchTrigger />
              
              {/* User Menu */}
              <UserMenu />
              
              {/* Mobile Navigation */}
              <MobileNavigation />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}