import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { payoutService, type BankAccount } from '@/lib/services/payout.service';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';

interface PayoutRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  fundraiserId?: string;
}

export function PayoutRequestDialog({
  open,
  onClose,
  onSuccess,
  userId,
  fundraiserId,
}: PayoutRequestDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    if (open) {
      fetchBankAccounts();
      // TODO: Fetch available balance when fundraiser context is available
      // if (fundraiserId) {
      //   fetchAvailableBalance();
      // }
    }
  }, [open, userId, fundraiserId]);

  const fetchBankAccounts = async () => {
    try {
      const accounts = await payoutService.getBankAccounts(userId);
      const verified = accounts.filter(acc => acc.verification_status === 'verified' && acc.is_active);
      setBankAccounts(verified);
      
      if (verified.length > 0) {
        const defaultAccount = verified.find(acc => acc.is_default) || verified[0];
        setSelectedBankId(defaultAccount.id);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load bank accounts",
        variant: "destructive",
      });
    }
  };

  const calculateFees = (amountValue: number) => {
    // Stripe fee: 2.9% + $0.30
    const stripeFee = amountValue * 0.029 + 0.30;
    // Platform fee: 5%
    const platformFee = amountValue * 0.05;
    const totalFees = stripeFee + platformFee;
    const netAmount = amountValue - totalFees;

    return {
      stripeFee: stripeFee.toFixed(2),
      platformFee: platformFee.toFixed(2),
      totalFees: totalFees.toFixed(2),
      netAmount: netAmount.toFixed(2),
    };
  };

  const fees = amount ? calculateFees(parseFloat(amount)) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBankId) {
      toast({
        title: "Bank Account Required",
        description: "Please select a bank account for payout",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payout amount",
        variant: "destructive",
      });
      return;
    }

    if (!fundraiserId) {
      toast({
        title: "Fundraiser Required",
        description: "Please select a fundraiser to request payout from",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await payoutService.requestPayout(
        fundraiserId,
        selectedBankId,
        parseFloat(amount),
        notes
      );

      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted for review",
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Failed to request payout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Request a payout from your available earnings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bank Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="bank-account">Bank Account</Label>
            {bankAccounts.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No verified bank accounts found. Please add and verify a bank account first.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bank_name} (...{account.account_number_last4})
                      {account.is_default && ' (Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                max={availableBalance || undefined}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Available: ${availableBalance.toFixed(2)}
            </p>
          </div>

          {/* Fee Breakdown */}
          {fees && (
            <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Request Amount:</span>
                <span className="font-medium">${amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stripe Fee (2.9% + $0.30):</span>
                <span className="text-destructive">-${fees.stripeFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee (5%):</span>
                <span className="text-destructive">-${fees.platformFee}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>You'll Receive:</span>
                <span className="text-primary">${fees.netAmount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated arrival: 3-5 business days
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this payout request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || bankAccounts.length === 0}>
              {loading ? 'Submitting...' : 'Request Payout'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
