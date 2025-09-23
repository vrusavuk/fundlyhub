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
  { to: '/fundly-give', label: 'Fundly Give' },
] as const;

export function NavigationMenu({ className, onNavigate, vertical = false }: NavigationMenuProps) {
  const linkClassName = "text-foreground hover:text-primary transition-smooth";
  const containerClassName = vertical 
    ? "flex flex-col space-y-1" 
    : "hidden md:flex items-center space-x-6";

  return (
    <nav className={`${containerClassName} ${className || ''}`} role={vertical ? "navigation" : undefined}>
      {navigationItems.map(({ to, label }) => (
        <Link 
          key={to}
          to={to} 
          className={vertical ? `${linkClassName} py-3 px-4 rounded-md hover:bg-accent/50 min-h-[44px] flex items-center` : linkClassName}
          onClick={onNavigate}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}