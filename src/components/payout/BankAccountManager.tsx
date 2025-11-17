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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { payoutService, type BankAccount } from '@/lib/services/payout.service';

interface BankAccountManagerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function BankAccountManager({ open, onClose, userId }: BankAccountManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Add form state
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountType, setAccountType] = useState('checking');

  useEffect(() => {
    if (open) {
      fetchBankAccounts();
    }
  }, [open, userId]);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await payoutService.getBankAccounts(userId);
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load bank accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await payoutService.addBankAccount({
        account_number: accountNumber,
        routing_number: routingNumber,
        account_holder_name: accountHolderName,
        account_type: accountType,
      });

      toast({
        title: "Bank Account Added",
        description: "Your bank account has been added. Verification may be required.",
      });

      // Reset form
      setAccountNumber('');
      setRoutingNumber('');
      setAccountHolderName('');
      setAccountType('checking');
      setShowAddForm(false);

      // Refresh list
      fetchBankAccounts();
    } catch (error) {
      toast({
        title: "Add Failed",
        description: error instanceof Error ? error.message : "Failed to add bank account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      verified: { variant: 'default' as const, icon: CheckCircle2, label: 'Verified' },
      pending: { variant: 'outline' as const, icon: Clock, label: 'Pending' },
      failed: { variant: 'destructive' as const, icon: AlertCircle, label: 'Failed' },
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Bank Accounts</DialogTitle>
          <DialogDescription>
            Add and manage your payout bank accounts
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4 mt-4">
            {loading && bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading accounts...
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No bank accounts added yet</p>
                <p className="text-sm">Add your first bank account to receive payouts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <Card key={account.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {account.bank_name || 'Bank Account'}
                            </span>
                            {account.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {account.account_holder_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {account.account_type} ••••{account.account_number_last4}
                          </p>
                          <div className="mt-2">
                            {getStatusBadge(account.verification_status)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4 mt-4">
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-holder">Account Holder Name</Label>
                <Input
                  id="account-holder"
                  placeholder="John Doe"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="routing">Routing Number</Label>
                <Input
                  id="routing"
                  placeholder="110000000"
                  maxLength={9}
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <p className="text-xs text-muted-foreground">9-digit routing number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Account Number</Label>
                <Input
                  id="account"
                  type="password"
                  placeholder="••••••••••"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Bank Account'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
