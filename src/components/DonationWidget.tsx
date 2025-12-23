import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Share2, Facebook, Twitter, Copy, Check, Gift, CreditCard, Wallet, ChevronLeft, EyeOff, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Appearance } from '@stripe/stripe-js';
import { UnifiedPaymentForm } from '@/components/payments/UnifiedPaymentForm';
import { useStripePayment } from '@/hooks/useStripePayment';
import { logger } from '@/lib/services/logger.service';
import { useTipFeedback } from '@/hooks/useTipFeedback';
import { TipFeedbackMessage } from '@/components/TipFeedbackMessage';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  logger.error('VITE_STRIPE_PUBLISHABLE_KEY is not defined in environment variables', undefined, {
    componentName: 'DonationWidget',
    operationName: 'initialization'
  });
}
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Stripe Elements appearance for unified styling
const stripeAppearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: 'hsl(var(--primary))',
    colorBackground: 'hsl(var(--background))',
    colorText: 'hsl(var(--foreground))',
    colorDanger: 'hsl(var(--destructive))',
    fontFamily: 'inherit',
    borderRadius: '8px',
  },
};

interface Donation {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
  is_anonymous?: boolean;
  donor_name?: string | null;
  donor_avatar?: string | null;
  profiles?: {
    name: string;
    avatar?: string;
  } | null;
}

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
  onSuccess?: () => void;
  isFloating?: boolean;
  donations?: Donation[];
  showDonors?: boolean;
  onViewAllDonors?: () => void;
  showInSheet?: boolean;
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
  onSuccess,
  isFloating = false,
  donations = [],
  showDonors = false,
  onViewAllDonors,
  showInSheet = false,
}: DonationWidgetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [tipPercentage, setTipPercentage] = useState<number | 'custom'>(15);
  const [customTipValue, setCustomTipValue] = useState('');
  const [showTip, setShowTip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(showInSheet);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [donorEmail, setDonorEmail] = useState('');
  const [donorName, setDonorName] = useState('');
  const { toast } = useToast();
  const { createPaymentIntent, isLoading } = useStripePayment();

  const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  const currentAmount = selectedAmount || parseFloat(customAmount) || 0;
  const tipAmount = tipPercentage === 'custom' 
    ? (parseFloat(customTipValue) || 0)
    : Math.round(currentAmount * (tipPercentage / 100) * 100) / 100;
  const totalAmount = currentAmount + tipAmount;
  
  const tipFeedback = useTipFeedback(tipPercentage, tipAmount, parseFloat(customTipValue) || 0);

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

  const handleTipSelect = (percentage: number | 'custom') => {
    setTipPercentage(percentage);
    if (percentage !== 'custom') {
      setCustomTipValue('');
    }
  };

  const handleDonate = async () => {
    if (currentAmount <= 0) return;

    const response = await createPaymentIntent({
      fundraiser_id: fundraiserId,
      amount: Math.round(currentAmount * 100),
      tip_amount: Math.round(tipAmount * 100),
      currency: currency,
      donor_email: !isAnonymous ? donorEmail : undefined,
      donor_name: !isAnonymous ? donorName : undefined,
      is_anonymous: isAnonymous,
    });

    if (response?.client_secret) {
      setClientSecret(response.client_secret);
      setShowPaymentForm(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setShowDonationForm(false);
    setClientSecret(null);
    setSelectedAmount(null);
    setCustomAmount('');
    setTipPercentage(15);
    setCustomTipValue('');
    setShowTip(false);
    setIsAnonymous(false);
    setDonorEmail('');
    setDonorName('');
    toast({
      title: 'Thank you!',
      description: 'Your donation has been processed successfully.',
    });
    onSuccess?.();
  };

  const handlePaymentError = (error: string) => {
    setShowPaymentForm(false);
    toast({
      title: 'Payment Failed',
      description: error,
      variant: 'destructive',
    });
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
      {showInSheet ? (
        // Compact Sheet Form (no Card wrapper)
        <div className="space-y-4">
          {/* Compact header */}
          <div className="text-center pb-4 border-b">
            <div className="text-2xl font-bold text-primary">
              {formatAmount(raisedAmount)}
            </div>
            <div className="text-sm text-muted-foreground">
              of {formatAmount(goalAmount)} goal
            </div>
          </div>
          
          {/* Suggested amounts - compact grid */}
          <div>
            <p className="font-medium mb-2 text-sm">Select amount</p>
            <div className="grid grid-cols-3 gap-2">
              {suggestedAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  onClick={() => handleAmountSelect(amount)}
                  className="h-11"
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
                className="h-11"
              >
                Other
              </Button>
            </div>
          </div>

          {/* Custom amount - compact */}
          {(!selectedAmount || customAmount) && (
            <div>
              <Input
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                className="h-11"
                min="1"
              />
            </div>
          )}

          {/* Tip section - compact */}
          {showTip && currentAmount > 0 && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">Support FundlyHub</p>
                  <p className="text-xs text-muted-foreground">We don't charge platform fees — your optional tip keeps us running</p>
                </div>
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 10, 15, 20].map((percentage) => (
                  <Button
                    key={percentage}
                    variant={tipPercentage === percentage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTipSelect(percentage)}
                    className="text-xs h-8 relative"
                  >
                    {percentage === 0 ? 'No tip' : `${percentage}%`}
                    {percentage === 15 && (
                      <Badge variant="secondary" className="absolute -top-2 -right-1 text-[8px] px-1 py-0 h-3">
                        Popular
                      </Badge>
                    )}
                  </Button>
                ))}
                <Button
                  variant={tipPercentage === 'custom' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTipSelect('custom')}
                  className="text-xs h-8"
                >
                  Custom
                </Button>
              </div>
              {tipPercentage === 'custom' && (
                <div className="mt-2">
                  <Input
                    type="number"
                    placeholder="Enter tip amount"
                    value={customTipValue}
                    onChange={(e) => setCustomTipValue(e.target.value)}
                    className="h-8 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
              <TipFeedbackMessage feedback={tipFeedback} className="mt-2" />
            </div>
          )}

          {/* Anonymous + Donate button - compact */}
          {currentAmount > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous-sheet"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                />
                <label htmlFor="anonymous-sheet" className="text-sm flex items-center gap-2 cursor-pointer">
                  <EyeOff className="h-4 w-4" />
                  Make anonymous
                </label>
              </div>

              {tipAmount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Your donation: {formatAmount(currentAmount)}</span>
                  <span>Tip: {formatAmount(tipAmount)}</span>
                </div>
              )}

              {!showPaymentForm ? (
                <>
                  {!isAnonymous && (
                    <>
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Your name"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={donorEmail}
                          onChange={(e) => setDonorEmail(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </>
                  )}

                  <Button
                    onClick={handleDonate}
                    disabled={isLoading || currentAmount <= 0}
                    className="w-full h-12 text-lg font-semibold"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Heart className="mr-2 h-5 w-5" />
                        Donate {formatAmount(totalAmount)}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                clientSecret && (
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: stripeAppearance,
                    }}
                  >
                    <UnifiedPaymentForm
                      clientSecret={clientSecret}
                      amount={Math.round(totalAmount * 100)}
                      currency={currency}
                      isAnonymous={isAnonymous}
                      donorEmail={donorEmail}
                      donorName={donorName}
                      returnUrl={`${window.location.origin}/payment/complete?return_to=${encodeURIComponent(`/fundraiser/${fundraiserId}`)}`}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onEmailChange={setDonorEmail}
                      onNameChange={setDonorName}
                    />
                  </Elements>
                )
              )}

              <div className="flex gap-2 text-xs text-muted-foreground justify-center">
                <CreditCard className="h-3 w-3" />
                <span>Secure payment powered by Stripe</span>
              </div>
            </div>
          )}

          {/* Donor avatars section for mobile/tablet */}
          {showDonors && donations && donations.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {donations.length} Recent {donations.length === 1 ? 'Donor' : 'Donors'}
                </h4>
              </div>
              <div className="flex -space-x-2 mb-3">
                {donations.slice(0, 6).map((donation) => {
                  const donorName = donation.donor_name || donation.profiles?.name || 'Anonymous';
                  const donorAvatar = donation.donor_avatar || donation.profiles?.avatar;
                  
                  return (
                    <Avatar key={donation.id} className="h-7 w-7 border-2 border-background">
                      <AvatarImage src={donorAvatar} />
                      <AvatarFallback className="text-xs">
                        {donorName.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
              </div>
              {onViewAllDonors && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs h-8"
                  onClick={onViewAllDonors}
                >
                  View all {donations.length} {donations.length === 1 ? 'donor' : 'donors'}
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        // Original Card-based layout for desktop
        <Card className={`shadow-lg border-0 transition-all duration-300 ${isFloating ? 'sticky top-4' : ''}`}>
          {!showDonationForm ? (
          // Summary View (GoFundMe style)
          <>
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
              
              <div className="text-center space-y-3">
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{donorCount}</div>
                    <div className="text-muted-foreground">donors</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{Math.round(progressPercentage)}%</div>
                    <div className="text-muted-foreground">funded</div>
                  </div>
                </div>
                {/* Additional stats */}
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <div className="text-center">
                    <div className="font-medium">30 days left</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">24 shares</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Button
                onClick={() => setShowDonationForm(true)}
                className="w-full h-12 text-lg font-semibold animate-scale-in"
                size="lg"
              >
                <Heart className="mr-2 h-5 w-5" />
                Donate now
              </Button>
              
              <div className="flex gap-2 text-xs text-muted-foreground justify-center">
                <CreditCard className="h-3 w-3" />
                <span>Secure payment powered by Stripe</span>
              </div>

              {/* Integrated Donors Section */}
              {showDonors && donations.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Recent Donors
                    </h4>
                  </div>
                  <div className="flex -space-x-2 mb-3">
                    {donations.slice(0, 5).map((donation) => {
                      const donorName = donation.donor_name || donation.profiles?.name || 'Anonymous';
                      const donorAvatar = donation.donor_avatar || donation.profiles?.avatar;
                      
                      return (
                        <Avatar key={donation.id} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={donorAvatar} />
                          <AvatarFallback className="text-xs">
                            {donorName.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={onViewAllDonors}
                  >
                    View all {donations.length} {donations.length === 1 ? 'donor' : 'donors'}
                  </Button>
                </div>
              )}
            </CardContent>
          </>
        ) : (
          // Full Donation Form
          <>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDonationForm(false)}
                  className="p-1 h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={creatorAvatar} />
                    <AvatarFallback>{creatorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">You're supporting</p>
                    <p className="text-sm text-muted-foreground">{creatorName}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {formatAmount(raisedAmount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  raised of {formatAmount(goalAmount)} goal
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
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
                      className="h-12 hover-scale"
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
                    className="h-12 hover-scale"
                  >
                    Other
                  </Button>
                </div>
              </div>

              {/* Custom amount input */}
              {(!selectedAmount || customAmount) && (
                <div className="animate-fade-in">
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
                <div className="border rounded-lg p-4 bg-muted/30 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-sm">Support FundlyHub</p>
                      <p className="text-xs text-muted-foreground">
                        We don't charge platform fees — your optional tip keeps us running
                      </p>
                    </div>
                    <Gift className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {[0, 10, 15, 20].map((percentage) => (
                      <Button
                        key={percentage}
                        variant={tipPercentage === percentage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTipSelect(percentage)}
                        className="text-xs hover-scale relative"
                      >
                        {percentage === 0 ? 'No tip' : `${percentage}%`}
                        {percentage === 15 && (
                          <Badge variant="secondary" className="absolute -top-2 -right-1 text-[8px] px-1 py-0 h-3">
                            Popular
                          </Badge>
                        )}
                      </Button>
                    ))}
                    <Button
                      variant={tipPercentage === 'custom' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTipSelect('custom')}
                      className="text-xs hover-scale"
                    >
                      Custom
                    </Button>
                  </div>
                  
                  {tipPercentage === 'custom' && (
                    <Input
                      type="number"
                      placeholder="Enter custom tip amount"
                      value={customTipValue}
                      onChange={(e) => setCustomTipValue(e.target.value)}
                      className="h-8 text-sm"
                      min="0"
                      step="0.01"
                    />
                  )}
                  
                  <TipFeedbackMessage feedback={tipFeedback} className="mt-3" />
                </div>
              )}

              {/* Total and donate button */}
              {currentAmount > 0 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Anonymous donation checkbox */}
                  <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
                    <Checkbox
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                    />
                    <label
                      htmlFor="anonymous"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      <EyeOff className="h-4 w-4" />
                      Make my donation anonymous
                    </label>
                  </div>

                  {tipAmount > 0 && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Your donation</span>
                        <span>{formatAmount(currentAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tip</span>
                        <span>{formatAmount(tipAmount)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg border-t pt-3">
                    <span>Total</span>
                    <span>{formatAmount(totalAmount)}</span>
                  </div>
                  
                  {!showPaymentForm ? (
                    <>
                      {!isAnonymous && (
                        <>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium">Name</label>
                            <Input
                              type="text"
                              placeholder="Your name"
                              value={donorName}
                              onChange={(e) => setDonorName(e.target.value)}
                              className="h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium">Email</label>
                            <Input
                              type="email"
                              placeholder="your.email@example.com"
                              value={donorEmail}
                              onChange={(e) => setDonorEmail(e.target.value)}
                              className="h-12"
                            />
                          </div>
                        </>
                      )}

                      <Button
                        onClick={handleDonate}
                        disabled={isLoading || currentAmount <= 0}
                        className="w-full h-12 text-lg font-semibold hover-scale"
                        size="lg"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                            Processing...
                          </div>
                        ) : (
                          <>
                            <Heart className="mr-2 h-5 w-5" />
                            Donate {formatAmount(totalAmount)}
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    clientSecret && (
                      <Elements 
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: stripeAppearance,
                        }}
                      >
                        <UnifiedPaymentForm
                          clientSecret={clientSecret}
                          amount={Math.round(totalAmount * 100)}
                          currency={currency}
                          isAnonymous={isAnonymous}
                          donorEmail={donorEmail}
                          donorName={donorName}
                          returnUrl={`${window.location.origin}/payment/complete?return_to=${encodeURIComponent(`/fundraiser/${fundraiserId}`)}`}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                          onEmailChange={setDonorEmail}
                          onNameChange={setDonorName}
                        />
                      </Elements>
                    )
                  )}

                  <div className="flex gap-2 text-xs text-muted-foreground justify-center">
                    <CreditCard className="h-3 w-3" />
                    <span>Secure payment powered by Stripe</span>
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}
        </Card>
      )}
    </div>
  );
}