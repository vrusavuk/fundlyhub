import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Heart, User, Menu, Search, LogOut, UserCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SearchModal } from "@/components/SearchModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-accent" />
              <span className="text-xl font-bold text-primary">FundlyHub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/campaigns" className="text-foreground hover:text-primary transition-smooth">
              Fundlies
            </Link>
            <Link to="/fundlypay" className="text-foreground hover:text-primary transition-smooth">
              FundlyPay
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="hidden md:flex"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {user ? (
              <>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/create">Start Fundraiser</Link>
                </Button>
                
                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                      <UserCircle className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
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
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/create">Start Fundraiser</Link>
                </Button>
                <Button variant="outline" size="sm" className="hidden md:inline-flex" asChild>
                  <Link to="/auth">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Modal */}
        <SearchModal 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="flex flex-col space-y-3">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Link to="/campaigns" className="text-foreground hover:text-primary transition-smooth py-2">
                Fundlies
              </Link>
              <Link to="/fundlypay" className="text-foreground hover:text-primary transition-smooth py-2">
                FundlyPay
              </Link>
              {user ? (
                <>
                  <Link to="/profile" className="text-foreground hover:text-primary transition-smooth py-2">
                    Profile
                  </Link>
                  <Button variant="outline" size="sm" className="justify-start" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link to="/auth">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}