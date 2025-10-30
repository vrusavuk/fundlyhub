/**
 * Stripe Payment Service
 * Handles Stripe payment processing using edge functions
 */

import { supabase } from '@/integrations/supabase/client';
import { loadStripe, Stripe, PaymentIntentResult } from '@stripe/stripe-js';

export interface CreatePaymentIntentRequest {
  fundraiser_id: string;
  amount: number; // in cents
  tip_amount?: number; // in cents
  currency?: string;
  donor_email?: string;
  donor_name?: string;
  is_anonymous?: boolean;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  stripe_fee: number;
  net_amount: number;
}

export class StripeService {
  private stripePromise: Promise<Stripe | null> | null = null;
  private readonly publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  /**
   * Initialize Stripe.js
   */
  private async getStripe(): Promise<Stripe | null> {
    if (!this.stripePromise) {
      this.stripePromise = loadStripe(this.publishableKey);
    }
    return this.stripePromise;
  }

  /**
   * Create a payment intent via edge function
   */
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: request,
    });

    if (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(error.message || 'Failed to create payment intent');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as PaymentIntentResponse;
  }

  /**
   * Confirm card payment with Stripe Elements
   */
  async confirmCardPayment(
    clientSecret: string,
    paymentMethodId: string
  ): Promise<PaymentIntentResult> {
    const stripe = await this.getStripe();
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    return stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });
  }

  /**
   * Handle successful payment
   */
  handlePaymentSuccess(paymentIntent: PaymentIntentResult['paymentIntent']): void {
    if (!paymentIntent) {
      throw new Error('Payment intent is null');
    }

    console.log('Payment successful:', paymentIntent.id);
    // The webhook will handle creating the donation record
  }

  /**
   * Handle payment error
   */
  handlePaymentError(error: any): string {
    console.error('Payment error:', error);

    if (error.type === 'card_error' || error.type === 'validation_error') {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Format amount for display
   */
  formatAmount(amountInCents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amountInCents / 100);
  }
}

// Export singleton instance
export const stripeService = new StripeService();
