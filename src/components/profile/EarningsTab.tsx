import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Wallet,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { payoutService, type PayoutRequest, type AvailableBalance } from '@/lib/services/payout.service';
import { PayoutRequestDialog } from '@/components/payout/PayoutRequestDialog';
import { BankAccountManager } from '@/components/payout/BankAccountManager';
import { KYCVerificationBanner } from '@/components/payout/KYCVerificationBanner';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { format } from 'date-fns';

interface EarningsTabProps {
  userId: string;
}

export function EarningsTab({ userId }: EarningsTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [balance, setBalance] = useState<AvailableBalance | null>(null);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [showBankManager, setShowBankManager] = useState(false);
  const [kycStatus, setKycStatus] = useState<any>(null);

  useEffect(() => {
    fetchEarningsData();
  }, [userId]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);

      // Fetch payout history
      const payoutData = await payoutService.getPayoutRequests({ userId });
      setPayouts(payoutData);

      // Fetch KYC status
      const kyc = await payoutService.getKYCStatus(userId);
      setKycStatus(kyc);

      // TODO: Fetch available balance when we have a fundraiser context
      // const balanceData = await payoutService.getAvailableBalance(fundraiserId);
      // setBalance(balanceData);

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      approved: { variant: "default", icon: CheckCircle2 },
      processing: { variant: "default", icon: TrendingUp },
      completed: { variant: "secondary", icon: CheckCircle2 },
      denied: { variant: "destructive", icon: AlertTriangle },
      info_required: { variant: "outline", icon: AlertTriangle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KYC Verification Banner */}
      {kycStatus && kycStatus.status !== 'verified' && (
        <KYCVerificationBanner kycStatus={kycStatus} />
      )}

      {/* Available Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Available Balance
              </CardTitle>
              <CardDescription>Your earnings ready for withdrawal</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBankManager(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Manage Banks
              </Button>
              <Button
                size="sm"
                onClick={() => setShowPayoutDialog(true)}
                disabled={kycStatus?.status !== 'verified'}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Request Payout
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-3xl font-bold text-primary">
                ${balance?.available_balance_str || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold text-muted-foreground">
                ${balance?.pending_balance_str || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On Hold</p>
              <p className="text-2xl font-semibold text-muted-foreground">
                ${balance?.held_balance_str || '0.00'}
              </p>
            </div>
          </div>

          {kycStatus?.status !== 'verified' && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Complete KYC verification to request payouts
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Your payout requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No payout requests yet</p>
              <p className="text-sm">Request your first payout when funds are available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">${payout.net_amount_str}</p>
                      {getStatusBadge(payout.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requested {format(new Date(payout.created_at), 'MMM d, yyyy')}
                    </p>
                    {payout.estimated_arrival_date && payout.status === 'processing' && (
                      <p className="text-xs text-muted-foreground">
                        Expected {format(new Date(payout.estimated_arrival_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Fee: ${payout.fee_amount_str}
                    </p>
                    {payout.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {payout.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PayoutRequestDialog
        open={showPayoutDialog}
        onClose={() => setShowPayoutDialog(false)}
        onSuccess={fetchEarningsData}
        userId={userId}
      />

      <BankAccountManager
        open={showBankManager}
        onClose={() => setShowBankManager(false)}
        userId={userId}
      />
    </div>
  );
}
