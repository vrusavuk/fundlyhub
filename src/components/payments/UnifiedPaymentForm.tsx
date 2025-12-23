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
import { StripePaymentElementChangeEvent } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Building2, Smartphone, Wallet } from 'lucide-react';

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

type PaymentMethodType = 'card' | 'paypal' | 'venmo' | 'us_bank_account' | 'apple_pay' | 'google_pay' | 'link';

const getPaymentIcon = (paymentMethod: PaymentMethodType) => {
  switch (paymentMethod) {
    case 'paypal':
    case 'venmo':
    case 'link':
      return <Wallet className="h-5 w-5" />;
    case 'us_bank_account':
      return <Building2 className="h-5 w-5" />;
    case 'apple_pay':
    case 'google_pay':
      return <Smartphone className="h-5 w-5" />;
    case 'card':
    default:
      return <CreditCard className="h-5 w-5" />;
  }
};

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('card');

  const handlePaymentElementChange = (event: StripePaymentElementChangeEvent) => {
    if (event.value.type) {
      setSelectedPaymentMethod(event.value.type as PaymentMethodType);
    }
  };

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
              address: {
                country: 'US',
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          onError(error.message || 'Payment failed');
        } else {
          onError('An unexpected error occurred. Please try again.');
        }
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          onSuccess();
        } else if (paymentIntent.status === 'processing') {
          onSuccess();
        } else if (paymentIntent.status === 'requires_action') {
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

      <PaymentElement
        onChange={handlePaymentElementChange}
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'paypal', 'us_bank_account'],
          fields: {
            billingDetails: {
              address: {
                country: 'never',
              },
            },
          },
          business: {
            name: 'FundlyHub',
          },
        }}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isProcessing}
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {getPaymentIcon(selectedPaymentMethod)}
            <span className="ml-2">Pay {formatAmount(amount)}</span>
          </>
        )}
      </Button>
    </form>
  );
}
