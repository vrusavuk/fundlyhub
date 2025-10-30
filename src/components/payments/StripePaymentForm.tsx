/**
 * Stripe Payment Form Component
 * Renders Stripe card input and handles payment submission
 */

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  isAnonymous: boolean;
  donorEmail?: string;
  donorName?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onEmailChange?: (email: string) => void;
  onNameChange?: (name: string) => void;
}

export function StripePaymentForm({
  clientSecret,
  amount,
  isAnonymous,
  donorEmail = '',
  donorName = '',
  onSuccess,
  onError,
  onEmailChange,
  onNameChange,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: donorEmail || undefined,
            name: donorName || undefined,
          },
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
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
        <Label>Card Details</Label>
        <div className="border rounded-md p-3 bg-background">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: 'hsl(var(--foreground))',
                  '::placeholder': {
                    color: 'hsl(var(--muted-foreground))',
                  },
                },
                invalid: {
                  color: 'hsl(var(--destructive))',
                },
              },
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || isProcessing}
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Donate ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100)}`
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Secured by Stripe. Your payment information is encrypted.
      </p>
    </form>
  );
}
