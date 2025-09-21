/**
 * Brand logo and site name component
 * Displays the FundlyHub branding with heart icon
 */
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <Link to="/" className={`flex items-center space-x-2 ${className || ''}`}>
      <Heart className="h-8 w-8 text-accent" />
      <span className="text-xl font-bold text-primary">FundlyHub</span>
    </Link>
  );
}