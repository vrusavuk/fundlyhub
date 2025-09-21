/**
 * Dialog for showing all donors with scrollable list
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatRelativeTime } from '@/lib/utils/formatters';

interface Donation {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
  profiles: {
    name: string;
    avatar?: string;
  } | null;
}

interface AllDonorsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  donations: Donation[];
}

export function AllDonorsDialog({ isOpen, onClose, donations }: AllDonorsDialogProps) {
  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            All Donors ({donations.length})
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {donations.map((donation) => (
              <div key={donation.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={donation.profiles?.avatar} />
                  <AvatarFallback className="text-sm font-medium">
                    {donation.profiles?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">
                      {donation.profiles?.name || 'Anonymous'}
                    </p>
                    <Badge variant="outline" className="text-primary font-semibold">
                      {formatCurrency(donation.amount, donation.currency)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(donation.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}