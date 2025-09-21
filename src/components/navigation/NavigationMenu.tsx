/**
 * Main navigation menu links component
 * Handles the primary navigation items
 */
import { Link } from 'react-router-dom';

interface NavigationMenuProps {
  className?: string;
  onNavigate?: () => void;
  vertical?: boolean;
}

const navigationItems = [
  { to: '/campaigns', label: 'Fundlies' },
  { to: '/fundlypay', label: 'FundlyPay' },
] as const;

export function NavigationMenu({ className, onNavigate, vertical = false }: NavigationMenuProps) {
  const linkClassName = "text-foreground hover:text-primary transition-smooth";
  const containerClassName = vertical 
    ? "flex flex-col space-y-3" 
    : "hidden md:flex items-center space-x-6";

  return (
    <div className={`${containerClassName} ${className || ''}`}>
      {navigationItems.map(({ to, label }) => (
        <Link 
          key={to}
          to={to} 
          className={vertical ? `${linkClassName} py-2` : linkClassName}
          onClick={onNavigate}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}