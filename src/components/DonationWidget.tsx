import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Share2, Facebook, Twitter, Copy, Check, Gift, CreditCard, Wallet } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface DonationWidgetProps {
  fundraiserId: string;
  title: string;
  creatorName: string;
  creatorAvatar?: string;
  goalAmount: number;
  raisedAmount: number;
  donorCount: number;
  progressPercentage: number;
  currency?: string;
  onDonate: (amount: number, tipAmount?: number) => void;
  loading?: boolean;
}

const suggestedAmounts = [25, 50, 100, 250, 500];

export function DonationWidget({
  fundraiserId,
  title,
  creatorName,
  creatorAvatar,
  goalAmount,
  raisedAmount,
  donorCount,
  progressPercentage,
  currency = 'USD',
  onDonate,
  loading = false,
}: DonationWidgetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  const currentAmount = selectedAmount || parseFloat(customAmount) || 0;
  const totalAmount = currentAmount + tipAmount;

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setShowTip(true);
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    setShowTip(value !== '');
  };

  const handleTipSelect = (percentage: number) => {
    const tip = Math.round(currentAmount * (percentage / 100) * 100) / 100;
    setTipAmount(tip);
  };

  const handleDonate = () => {
    if (currentAmount > 0) {
      onDonate(currentAmount, tipAmount);
    }
  };

  const handleShare = async (platform?: string) => {
    const url = `${window.location.origin}/fundraiser/${fundraiserId}`;
    const text = `Help support: ${title}`;

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast({ title: "Link copied!", description: "Fundraiser link copied to clipboard" });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast({ title: "Failed to copy", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Main donation card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={creatorAvatar} />
              <AvatarFallback>{creatorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">You're supporting</p>
              <p className="text-sm text-muted-foreground">{creatorName}</p>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">
              {formatAmount(raisedAmount)}
            </div>
            <div className="text-muted-foreground">
              raised of {formatAmount(goalAmount)} goal
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{donorCount} donors</span>
              <span>{Math.round(progressPercentage)}% funded</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Suggested amounts */}
          <div>
            <p className="font-medium mb-3">Select an amount to donate</p>
            <div className="grid grid-cols-3 gap-2">
              {suggestedAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  onClick={() => handleAmountSelect(amount)}
                  className="h-12"
                >
                  {formatAmount(amount)}
                </Button>
              ))}
              <Button
                variant={customAmount ? "default" : "outline"}
                onClick={() => {
                  setSelectedAmount(null);
                  setShowTip(false);
                }}
                className="h-12"
              >
                Other
              </Button>
            </div>
          </div>

          {/* Custom amount input */}
          {(!selectedAmount || customAmount) && (
            <div>
              <label className="block text-sm font-medium mb-2">Enter amount</label>
              <Input
                type="number"
                placeholder="0"
                value={customAmount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                className="text-lg h-12"
                min="1"
                step="0.01"
              />
            </div>
          )}

          {/* Tip section */}
          {showTip && currentAmount > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">Tip FundlyHub</p>
                  <p className="text-xs text-muted-foreground">
                    Help us keep the platform running
                  </p>
                </div>
                <Gift className="h-4 w-4 text-primary" />
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[0, 10, 15, 20].map((percentage) => (
                  <Button
                    key={percentage}
                    variant={tipAmount === Math.round(currentAmount * (percentage / 100) * 100) / 100 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTipSelect(percentage)}
                    className="text-xs"
                  >
                    {percentage === 0 ? 'No tip' : `${percentage}%`}
                  </Button>
                ))}
              </div>
              
              <Input
                type="number"
                placeholder="Custom tip amount"
                value={tipAmount || ''}
                onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                className="h-8 text-sm"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* Total and donate button */}
          {currentAmount > 0 && (
            <div className="space-y-4">
              {tipAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Your donation</span>
                  <span>{formatAmount(currentAmount)}</span>
                  <span>Tip</span>
                  <span>{formatAmount(tipAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total</span>
                <span>{formatAmount(totalAmount)}</span>
              </div>
              
              <Button
                onClick={handleDonate}
                disabled={loading || currentAmount <= 0}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <Heart className="mr-2 h-5 w-5" />
                    Donate {formatAmount(totalAmount)}
                  </>
                )}
              </Button>

              <div className="flex gap-2 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3" />
                <span>Secure payment powered by Stripe</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share this fundraiser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share on Facebook</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share on Twitter</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="outline"
              onClick={() => handleShare()}
              className="flex items-center gap-2 col-span-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}