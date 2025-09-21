/**
 * Refactored Navigation component using composition pattern
 * Combines smaller focused components for better maintainability
 */
import { useGlobalSearch } from '@/contexts/SearchContext';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Brand Logo */}
            <BrandLogo />

            {/* Desktop Navigation Menu */}
            <NavigationMenu />

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
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