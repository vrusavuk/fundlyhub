/**
 * Dialog for showing all donors with scrollable list
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';

interface Donation {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
  is_anonymous?: boolean;
  donor_name?: string | null;
  donor_avatar?: string | null;
  donor_email?: string | null;
  payment_status?: string;
  message?: string;
  // Legacy support for old structure
  profiles?: {
    name: string;
    avatar?: string;
  } | null;
}

interface AllDonorsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  donations: Donation[];
  isAdminView?: boolean;
}

export function AllDonorsDialog({ isOpen, onClose, donations, isAdminView = false }: AllDonorsDialogProps) {
  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            All Donors ({donations.length})
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {donations.map((donation) => {
              // Support both new privacy view and legacy structure
              const donorName = donation.donor_name || donation.profiles?.name || 'Anonymous';
              const donorAvatar = donation.donor_avatar || donation.profiles?.avatar;
              
              return (
                <div key={donation.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={donorAvatar} />
                    <AvatarFallback className="text-sm font-medium">
                      {donorName.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">
                        {donorName}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isAdminView && donation.payment_status && (
                          <Badge variant={donation.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {donation.payment_status}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-primary font-semibold">
                          {MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {isAdminView && donation.donor_email && (
                        <>
                          <span className="truncate">{donation.donor_email}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{formatRelativeTime(donation.created_at)}</span>
                    </div>

                    {isAdminView && donation.message && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                        <p className="text-muted-foreground italic">"{donation.message}"</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}