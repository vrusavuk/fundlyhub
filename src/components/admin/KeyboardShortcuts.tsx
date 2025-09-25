import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Users, 
  FileText, 
  Building2, 
  BarChart3, 
  Settings,
  HelpCircle,
  Command
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClasses } from '@/lib/design/typography';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'global';
  icon?: React.ComponentType<{ className?: string }>;
}

interface KeyboardShortcutsProps {
  onSearchFocus?: () => void;
}

export function KeyboardShortcuts({ onSearchFocus }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commandPalette, setCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const shortcuts: Shortcut[] = [
    // Navigation shortcuts
    {
      key: 'g d',
      description: 'Go to Dashboard',
      action: () => navigate('/admin'),
      category: 'navigation',
      icon: BarChart3
    },
    {
      key: 'g u',
      description: 'Go to Users',
      action: () => navigate('/admin/users'),
      category: 'navigation',
      icon: Users
    },
    {
      key: 'g c',
      description: 'Go to Campaigns',
      action: () => navigate('/admin/campaigns'),
      category: 'navigation',
      icon: FileText
    },
    {
      key: 'g o',
      description: 'Go to Organizations',
      action: () => navigate('/admin/organizations'),
      category: 'navigation',
      icon: Building2
    },
    // Global shortcuts
    {
      key: 'cmd+k',
      description: 'Open Command Palette',
      action: () => setCommandPalette(true),
      category: 'global',
      icon: Command
    },
    {
      key: '/',
      description: 'Focus Search',
      action: () => onSearchFocus?.(),
      category: 'global',
      icon: Search
    },
    {
      key: '?',
      description: 'Show Keyboard Shortcuts',
      action: () => setIsOpen(true),
      category: 'global',
      icon: HelpCircle
    },
    // Action shortcuts
    {
      key: 'r',
      description: 'Refresh Page Data',
      action: () => window.location.reload(),
      category: 'actions'
    },
    {
      key: 'esc',
      description: 'Close Dialogs/Cancel',
      action: () => {
        setIsOpen(false);
        setCommandPalette(false);
      },
      category: 'actions'
    }
  ];

  const commandPaletteItems = [
    { label: 'Dashboard', path: '/admin', icon: BarChart3 },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Campaigns', path: '/admin/campaigns', icon: FileText },
    { label: 'Organizations', path: '/admin/organizations', icon: Building2 },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'System Settings', path: '/admin/system', icon: Settings },
  ];

  const filteredCommands = commandPaletteItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle command palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPalette(true);
        return;
      }

      // Handle help dialog
      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          setIsOpen(true);
          return;
        }
      }

      // Handle search focus
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          onSearchFocus?.();
          return;
        }
      }

      // Handle escape
      if (event.key === 'Escape') {
        setIsOpen(false);
        setCommandPalette(false);
        return;
      }

      // Handle navigation shortcuts (g + key)
      if (event.key === 'g' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          // Wait for next key
          const handleNextKey = (nextEvent: KeyboardEvent) => {
            nextEvent.preventDefault();
            const shortcut = shortcuts.find(s => s.key === `g ${nextEvent.key}`);
            if (shortcut) {
              shortcut.action();
            }
            document.removeEventListener('keydown', handleNextKey);
          };
          document.addEventListener('keydown', handleNextKey);
          return;
        }
      }

      // Handle refresh
      if (event.key === 'r' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          window.location.reload();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSearchFocus, navigate, shortcuts]);

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions',
    global: 'Global'
  };

  return (
    <>
      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl shadow-medium bg-background/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className={getTypographyClasses('heading', 'lg')}>
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription className={getTypographyClasses('body', 'md', 'text-muted-foreground')}>
              Use these shortcuts to navigate faster through the admin panel
            </DialogDescription>
          </DialogHeader>
          
          <div className={getSpacingClasses('section', 'sm')}>
            {Object.entries(categoryLabels).map(([category, label]) => {
              const categoryShortcuts = shortcuts.filter(s => s.category === category);
              
              return (
                <div key={category} className={getSpacingClasses('content', 'md')}>
                  <h3 className={cn(
                    getTypographyClasses('heading', 'sm'),
                    "border-b border-primary/10 pb-2"
                  )}>
                    {label}
                  </h3>
                  
                  <div className={getSpacingClasses('content', 'sm')}>
                    {categoryShortcuts.map((shortcut) => {
                      const Icon = shortcut.icon;
                      
                      return (
                        <div key={shortcut.key} className="flex items-center justify-between py-2 hover:bg-primary/5 rounded-md px-2 transition-colors">
                          <div className="flex items-center space-x-3">
                            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                            <span className={getTypographyClasses('body', 'md')}>
                              {shortcut.description}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {shortcut.key.split(' ').map((key, index) => (
                              <Badge key={index} variant="outline" className="font-mono text-xs">
                                {key === 'cmd' ? '⌘' : key === 'ctrl' ? 'Ctrl' : key}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Palette */}
      <Dialog open={commandPalette} onOpenChange={setCommandPalette}>
        <DialogContent className="max-w-lg shadow-medium bg-background/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">Command Palette</DialogTitle>
          </DialogHeader>
          
          <div className={getSpacingClasses('content', 'sm')}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary/30"
                autoFocus
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {filteredCommands.length > 0 ? (
                <div className={getSpacingClasses('content', 'sm')}>
                  {filteredCommands.map((item) => {
                    const Icon = item.icon;
                    
                    return (
                      <Button
                        key={item.path}
                        variant="ghost"
                        className="w-full justify-start hover:bg-primary/5 h-12"
                        onClick={() => {
                          navigate(item.path);
                          setCommandPalette(false);
                          setSearchQuery('');
                        }}
                      >
                        <Icon className="mr-3 h-4 w-4" />
                        <span>{item.label}</span>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className={getTypographyClasses('body', 'md')}>No commands found</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}