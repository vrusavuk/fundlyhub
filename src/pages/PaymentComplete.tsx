/**
 * Payment Complete Page
 * Handles redirect returns from PayPal, Venmo, and Bank payments
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Clock, ArrowLeft } from 'lucide-react';
import { logger } from '@/lib/services/logger.service';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type PaymentStatus = 'loading' | 'succeeded' | 'processing' | 'failed';

export default function PaymentComplete() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
      const redirectStatus = searchParams.get('redirect_status');

      if (!paymentIntentClientSecret) {
        setStatus('failed');
        setMessage('Invalid payment session. Please try again.');
        return;
      }

      // Quick check based on redirect_status
      if (redirectStatus === 'succeeded') {
        setStatus('succeeded');
        setMessage('Your donation has been received. Thank you for your generosity!');
        return;
      }

      if (redirectStatus === 'failed') {
        setStatus('failed');
        setMessage('Payment was not completed. Please try again.');
        return;
      }

      // For other statuses, verify with Stripe
      try {
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Stripe not initialized');
        }

        const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);

        if (!paymentIntent) {
          throw new Error('Payment intent not found');
        }

        switch (paymentIntent.status) {
          case 'succeeded':
            setStatus('succeeded');
            setMessage('Your donation has been received. Thank you for your generosity!');
            break;
          case 'processing':
            setStatus('processing');
            setMessage('Your payment is being processed. This may take a few moments for bank transfers.');
            break;
          case 'requires_payment_method':
            setStatus('failed');
            setMessage('Payment was not completed. Please try again with a different payment method.');
            break;
          default:
            setStatus('failed');
            setMessage('Something went wrong. Please try again.');
        }
      } catch (error) {
        logger.error('Error checking payment status', error as Error);
        setStatus('failed');
        setMessage('Unable to verify payment status. Please check your email for confirmation.');
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const getFundraiserUrl = () => {
    // Try to extract fundraiser info from the URL or use default
    const returnTo = searchParams.get('return_to');
    if (returnTo) {
      return returnTo;
    }
    return '/campaigns';
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-primary animate-spin" />;
      case 'succeeded':
        return <CheckCircle2 className="h-16 w-16 text-green-500" />;
      case 'processing':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-destructive" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Payment...';
      case 'succeeded':
        return 'Thank You!';
      case 'processing':
        return 'Payment Processing';
      case 'failed':
        return 'Payment Failed';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">{getStatusTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">{message}</p>

          {status === 'succeeded' && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                A confirmation email will be sent to your email address.
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Bank transfers typically take 1-3 business days to complete.
                You'll receive an email once the transfer is confirmed.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate(getFundraiserUrl())} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Campaign
            </Button>
            
            {status === 'failed' && (
              <Button variant="outline" onClick={() => navigate(-1)}>
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
