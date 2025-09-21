import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Heart, User, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

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
            <Link to="/" className="text-foreground hover:text-primary transition-smooth">
              Browse
            </Link>
            <a href="#" className="text-foreground hover:text-primary transition-smooth">
              Categories
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-smooth">
              How it works
            </a>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center max-w-md flex-1 mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search fundraisers..." 
                className="pl-10 bg-secondary/50 border-0"
              />
            </div>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search fundraisers..." 
                  className="pl-10 bg-secondary/50 border-0"
                />
              </div>
              <Link to="/" className="text-foreground hover:text-primary transition-smooth py-2">
                Browse
              </Link>
              <a href="#" className="text-foreground hover:text-primary transition-smooth py-2">
                Categories
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-smooth py-2">
                How it works
              </a>
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