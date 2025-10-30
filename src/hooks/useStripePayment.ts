/**
 * Stripe Payment Hook
 * Manages Stripe payment flow
 */

import { useState } from 'react';
import { stripeService, CreatePaymentIntentRequest, PaymentIntentResponse } from '@/lib/services/stripe.service';
import { useToast } from '@/hooks/use-toast';

export interface UseStripePaymentReturn {
  createPaymentIntent: (request: CreatePaymentIntentRequest) => Promise<PaymentIntentResponse | null>;
  processPayment: (clientSecret: string, paymentMethodId: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useStripePayment(): UseStripePaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createPaymentIntent = async (
    request: CreatePaymentIntentRequest
  ): Promise<PaymentIntentResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await stripeService.createPaymentIntent(request);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(errorMessage);
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async (
    clientSecret: string,
    paymentMethodId: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await stripeService.confirmCardPayment(clientSecret, paymentMethodId);

      if (result.error) {
        const errorMessage = stripeService.handlePaymentError(result.error);
        setError(errorMessage);
        toast({
          title: 'Payment Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }

      if (result.paymentIntent) {
        stripeService.handlePaymentSuccess(result.paymentIntent);
        toast({
          title: 'Payment Successful',
          description: 'Your donation has been processed successfully!',
        });
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPaymentIntent,
    processPayment,
    isLoading,
    error,
  };
}
