/**
 * Unified Payment Form Component
 * Uses Stripe PaymentElement to support multiple payment methods:
 * - Credit/Debit Cards
 * - PayPal
 * - Venmo
 * - Bank (ACH Direct Debit)
 * - Apple Pay (on supported devices)
 * - Google Pay (on supported devices)
 */

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Wallet } from 'lucide-react';

interface UnifiedPaymentFormProps {
  clientSecret: string;
  amount: number; // in cents
  currency?: string;
  isAnonymous: boolean;
  donorEmail?: string;
  donorName?: string;
  returnUrl: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onEmailChange?: (email: string) => void;
  onNameChange?: (name: string) => void;
}

export function UnifiedPaymentForm({
  clientSecret,
  amount,
  currency = 'USD',
  isAnonymous,
  donorEmail = '',
  donorName = '',
  returnUrl,
  onSuccess,
  onError,
  onEmailChange,
  onNameChange,
}: UnifiedPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              email: donorEmail || undefined,
              name: donorName || undefined,
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        // Handle errors from payment confirmation
        if (error.type === 'card_error' || error.type === 'validation_error') {
          onError(error.message || 'Payment failed');
        } else {
          onError('An unexpected error occurred. Please try again.');
        }
      } else if (paymentIntent) {
        // Payment succeeded without redirect
        if (paymentIntent.status === 'succeeded') {
          onSuccess();
        } else if (paymentIntent.status === 'processing') {
          // Bank transfers may take time
          onSuccess();
        } else if (paymentIntent.status === 'requires_action') {
          // This case is handled by Stripe redirect
          onError('Payment requires additional authentication. Please follow the prompts.');
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amountInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amountInCents / 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isAnonymous && (
        <>
          <div className="space-y-2">
            <Label htmlFor="donor-name">Name</Label>
            <Input
              id="donor-name"
              type="text"
              value={donorName}
              onChange={(e) => onNameChange?.(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="donor-email">Email</Label>
            <Input
              id="donor-email"
              type="email"
              value={donorEmail}
              onChange={(e) => onEmailChange?.(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Payment Method
        </Label>
        <div className="border rounded-md p-3 bg-background">
          <PaymentElement
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'paypal', 'us_bank_account'],
              business: {
                name: 'FundlyHub',
              },
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isProcessing}
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {formatAmount(amount)}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Secured by Stripe</span>
        <span>•</span>
        <span>Cards, PayPal, Venmo, Bank & more</span>
      </div>
    </form>
  );
}
