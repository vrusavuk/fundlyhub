/**
 * Donation Widget with Stripe Integration
 * Replaces mock donation flow with real Stripe payments
 */

import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { StripePaymentForm } from '@/components/payments/StripePaymentForm';
import { useStripePayment } from '@/hooks/useStripePayment';
import { Heart, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe('pk_test_51QjbQHEaFU4kF5x4lPuSfGi2gdhVJxlvPWv7ggb7xDAWs3b7jTkZEqIuKb1WVUFXp6SVvV2CeBYUvELTsrjbRJWS00OAqCSPrA');

interface DonationWidgetWithStripeProps {
  fundraiserId: string;
  onSuccess?: () => void;
}

export function DonationWidgetWithStripe({ fundraiserId, onSuccess }: DonationWidgetWithStripeProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [tipPercentage, setTipPercentage] = useState(15);
  const [showTip, setShowTip] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorEmail, setDonorEmail] = useState('');
  const [donorName, setDonorName] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [step, setStep] = useState<'amount' | 'payment'>('amount');

  const { createPaymentIntent, isLoading } = useStripePayment();
  const { toast } = useToast();

  const donationAmount = (selectedAmount || parseFloat(customAmount) || 0) * 100; // Convert to cents
  const tipAmount = showTip ? Math.round((donationAmount * tipPercentage) / 100) : 0;
  const totalAmount = donationAmount + tipAmount;

  const suggestedAmounts = [10, 25, 50, 100, 250];

  const handleProceedToPayment = async () => {
    if (donationAmount < 100) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum donation is $1.00',
        variant: 'destructive',
      });
      return;
    }

    const response = await createPaymentIntent({
      fundraiser_id: fundraiserId,
      amount: donationAmount,
      tip_amount: tipAmount,
      currency: 'USD',
      donor_email: isAnonymous ? undefined : donorEmail,
      donor_name: isAnonymous ? undefined : donorName,
      is_anonymous: isAnonymous,
    });

    if (response?.client_secret) {
      setClientSecret(response.client_secret);
      setStep('payment');
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: 'Thank You!',
      description: 'Your donation has been processed successfully.',
    });
    setStep('amount');
    setSelectedAmount(25);
    setCustomAmount('');
    setClientSecret(null);
    onSuccess?.();
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: 'Payment Failed',
      description: error,
      variant: 'destructive',
    });
  };

  if (step === 'payment' && clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Complete Your Donation
          </CardTitle>
          <CardDescription>
            Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount / 100)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise}>
            <StripePaymentForm
              clientSecret={clientSecret}
              amount={totalAmount}
              isAnonymous={isAnonymous}
              donorEmail={donorEmail}
              donorName={donorName}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onEmailChange={setDonorEmail}
              onNameChange={setDonorName}
            />
          </Elements>
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setStep('amount')}
          >
            Back to Amount Selection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Make a Donation
        </CardTitle>
        <CardDescription>Choose your donation amount</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Suggested Amounts */}
        <div className="space-y-3">
          <Label>Select Amount</Label>
          <div className="grid grid-cols-5 gap-2">
            {suggestedAmounts.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
                className="w-full"
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="space-y-2">
          <Label htmlFor="custom-amount">Custom Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="custom-amount"
              type="number"
              min="1"
              step="0.01"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="Enter amount"
              className="pl-7"
            />
          </div>
        </div>

        <Separator />

        {/* Anonymous Donation */}
        <div className="flex items-center justify-between">
          <Label htmlFor="anonymous" className="cursor-pointer">
            Donate anonymously
          </Label>
          <Switch
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
        </div>

        {/* Tip Section */}
        <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-tip" className="cursor-pointer flex items-center gap-2">
              Add a tip to support our platform
              <Info className="h-4 w-4 text-muted-foreground" />
            </Label>
            <Switch
              id="show-tip"
              checked={showTip}
              onCheckedChange={setShowTip}
            />
          </div>

          {showTip && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tip Amount</span>
                <span className="font-medium">{tipPercentage}%</span>
              </div>
              <Slider
                value={[tipPercentage]}
                onValueChange={([value]) => setTipPercentage(value)}
                min={0}
                max={25}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-2 rounded-lg border p-4 bg-card">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Donation</span>
            <span className="font-medium">
              ${(donationAmount / 100).toFixed(2)}
            </span>
          </div>
          {showTip && tipAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tip ({tipPercentage}%)</span>
              <span className="font-medium">
                ${(tipAmount / 100).toFixed(2)}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary">
              ${(totalAmount / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={handleProceedToPayment}
          disabled={donationAmount < 100 || isLoading}
          size="lg"
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Continue to Payment'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          100% of your donation goes to the campaign creator. Tips help keep our platform running.
        </p>
      </CardContent>
    </Card>
  );
}
