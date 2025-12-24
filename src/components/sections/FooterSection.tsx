/**
 * Footer Section Component - Site-wide footer with navigation
 * Contains company links, resources, and branding elements
 */
import { Link } from 'react-router-dom';
import { Heart } from "lucide-react";
import cytyLogo from '@/assets/cyty-logo.svg';

export function FooterSection() {
  return (
    <footer className="bg-foreground/5 mobile-section py-8 sm:py-12">
      <div className="max-w-7xl mx-auto mobile-container">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-accent" />
              <span className="text-lg font-bold">FundlyHub</span>
            </div>
            <p className="text-muted-foreground">
              Connecting causes with caring people worldwide
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Powered by</span>
              <img src={cytyLogo} alt="CYTY Inc." className="h-5 w-auto" />
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Fundraisers</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/create" className="hover:text-primary transition-smooth">Start a Campaign</Link></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Success Stories</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Resources</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Donors</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">How to Give</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Trust & Safety</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Help Center</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Press</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Careers</a></li>
              <li><Link to="/docs" className="hover:text-primary transition-smooth">Developers</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 FundlyHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}