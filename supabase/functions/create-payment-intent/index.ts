import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { 
      fundraiser_id, 
      amount, 
      tip_amount = 0, 
      currency = 'USD',
      donor_email,
      donor_name,
      is_anonymous = false 
    } = await req.json();

    // Validate inputs
    if (!fundraiser_id || !amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid input. Amount must be at least $1.00 (100 cents)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total amount including tip
    const totalAmount = Math.round(amount + tip_amount);

    // Calculate Stripe fee (2.9% + $0.30)
    const stripeFee = Math.round(totalAmount * 0.029 + 30);
    const netAmount = totalAmount - stripeFee;

    // Create or retrieve Stripe customer if email provided
    let customerId: string | undefined;
    if (donor_email && !is_anonymous) {
      const customers = await stripe.customers.list({
        email: donor_email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: donor_email,
          name: donor_name,
          metadata: {
            fundraiser_id,
          },
        });
        customerId = customer.id;
      }
    }

    // Create PaymentIntent with explicit payment methods
    // Excludes Klarna, crypto, and other unwanted methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency.toLowerCase(),
      customer: customerId,
      payment_method_types: ['card', 'paypal', 'venmo', 'us_bank_account', 'link'],
      metadata: {
        fundraiser_id,
        tip_amount: tip_amount.toString(),
        donation_amount: amount.toString(),
        is_anonymous: is_anonymous.toString(),
        donor_email: donor_email || '',
        donor_name: donor_name || '',
      },
      description: `Donation to campaign ${fundraiser_id}`,
    });

    console.log('PaymentIntent created:', paymentIntent.id);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: totalAmount,
        stripe_fee: stripeFee,
        net_amount: netAmount,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: 'Payment processing failed. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
