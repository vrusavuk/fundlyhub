/**
 * Keyboard Shortcut Help Dialog
 * Displays available keyboard shortcuts for admin panel
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard, Command } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'K'], description: 'Open search', category: 'Navigation' },
  { keys: ['Ctrl', '/'], description: 'Show shortcuts', category: 'Navigation' },
  { keys: ['G', 'D'], description: 'Go to dashboard', category: 'Navigation' },
  { keys: ['G', 'U'], description: 'Go to users', category: 'Navigation' },
  { keys: ['G', 'C'], description: 'Go to campaigns', category: 'Navigation' },
  { keys: ['G', 'O'], description: 'Go to organizations', category: 'Navigation' },
  { keys: ['N'], description: 'Create new', category: 'Actions' },
  { keys: ['E'], description: 'Edit selected', category: 'Actions' },
  { keys: ['Del'], description: 'Delete selected', category: 'Actions' },
  { keys: ['Esc'], description: 'Close dialog', category: 'General' },
  { keys: ['?'], description: 'Show help', category: 'General' },
];

export function KeyboardShortcutHelp() {
  const [open, setOpen] = useState(false);

  const groupedShortcuts = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <Badge
                          key={keyIndex}
                          variant="outline"
                          className="font-mono text-xs px-2 py-1"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground pt-4 border-t">
          <p>Press <kbd className="px-1 py-0.5 bg-muted rounded text-foreground">Ctrl + /</kbd> to toggle this dialog anytime</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
