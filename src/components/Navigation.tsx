import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Heart, User, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedSearch } from "@/components/EnhancedSearch";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

          {/* Enhanced Search Bar */}
          <div className="hidden md:flex items-center max-w-md flex-1 mx-8">
            <EnhancedSearch 
              className="w-full"
              placeholder="Search campaigns, users, organizations..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <span className="hidden md:inline text-sm text-muted-foreground">
                  Welcome, {user.user_metadata?.name || user.email}
                </span>
                <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={handleSignOut}>
                  <User className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/create">Start Fundraiser</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="hidden md:inline-flex" asChild>
                  <Link to="/auth">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/create">Start Fundraiser</Link>
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
          <div className="flex flex-col space-y-3">
            <EnhancedSearch 
              placeholder="Search campaigns, users, organizations..."
              onResultClick={() => setIsMenuOpen(false)}
            />
              <Link to="/campaigns" className="text-foreground hover:text-primary transition-smooth py-2">
                Fundlies
              </Link>
              <Link to="/fundlypay" className="text-foreground hover:text-primary transition-smooth py-2">
                FundlyPay
              </Link>
              {user ? (
                <Button variant="outline" size="sm" className="justify-start" onClick={handleSignOut}>
                  <User className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
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