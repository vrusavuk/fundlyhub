/**
 * Floating action button for mobile documentation menu
 */
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileDocsNavigation } from './MobileDocsNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

export function DocsFloatingMenu() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <>
      <MobileDocsNavigation open={open} onOpenChange={setOpen} />
      
      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open navigation menu</span>
      </Button>
    </>
  );
}
