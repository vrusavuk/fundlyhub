/**
 * Documentation sidebar navigation
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Book, Code, Database, Search, Users, Heart, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: "Getting Started",
    icon: <Book className="h-4 w-4" />,
    children: [
      { title: "Overview", href: "/docs" },
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "Authentication", href: "/docs/authentication" },
      { title: "Rate Limits", href: "/docs/rate-limits" }
    ]
  },
  {
    title: "API Reference",
    icon: <Code className="h-4 w-4" />,
    children: [
      { title: "Fundraisers", href: "/docs/fundraisers", icon: <Heart className="h-3 w-3" /> },
      { title: "Categories", href: "/docs/categories", icon: <Database className="h-3 w-3" /> },
      { title: "User Profiles", href: "/docs/profiles", icon: <Users className="h-3 w-3" /> },
      { title: "Organizations", href: "/docs/organizations", icon: <Building className="h-3 w-3" /> },
      { title: "Donations", href: "/docs/donations", icon: <Heart className="h-3 w-3" /> },
      { title: "Search", href: "/docs/search", icon: <Search className="h-3 w-3" /> }
    ]
  },
  {
    title: "Examples",
    icon: <Code className="h-4 w-4" />,  
    children: [
      { title: "JavaScript/TypeScript", href: "/docs/javascript-examples" },
      { title: "cURL", href: "/docs/curl-examples" },
      { title: "Interactive Explorer", href: "/docs/explorer" }
    ]
  }
];

export function DocsSidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Getting Started", "API Reference"]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = isActive(item.href);

    return (
      <div key={item.title}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
            level === 0 ? "font-medium" : "font-normal",
            level > 0 && "ml-4",
            active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.title);
            }
          }}
        >
          {hasChildren && (
            <span className="flex-shrink-0">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          {item.href && !hasChildren ? (
            <Link to={item.href} className="flex-1">
              {item.title}
            </Link>
          ) : (
            <span className="flex-1">{item.title}</span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed top-14 sm:top-16 left-0 w-64 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] border-r border-border bg-background/95 backdrop-blur-sm overflow-y-auto z-30">
      <div className="pt-6 px-4 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Book className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold text-sm">API Documentation</div>
            <div className="text-xs text-muted-foreground">v1.0.0</div>
          </div>
        </div>
        
        <nav className="space-y-1">
          {navigation.map(item => renderNavItem(item))}
        </nav>
      </div>
    </div>
  );
}