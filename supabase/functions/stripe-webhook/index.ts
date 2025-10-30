import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Stripe keys not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook event received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;

        console.log('Payment succeeded:', paymentIntent.id);

        const donationAmount = parseInt(metadata.donation_amount || '0');
        const tipAmount = parseInt(metadata.tip_amount || '0');
        const totalAmount = paymentIntent.amount;
        const stripeFee = Math.round(totalAmount * 0.029 + 30);
        const netAmount = totalAmount - stripeFee;

        // Create donation record
        const { error: donationError } = await supabase
          .from('donations')
          .insert({
            fundraiser_id: metadata.fundraiser_id,
            donor_user_id: null, // Anonymous or will be linked later
            amount: donationAmount / 100, // Convert cents to dollars
            tip_amount: tipAmount / 100,
            fee_amount: stripeFee / 100,
            net_amount: netAmount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            payment_provider: 'stripe',
            payment_status: 'paid',
            receipt_id: paymentIntent.id,
            is_anonymous: metadata.is_anonymous === 'true',
            donor_email: metadata.donor_email || null,
            donor_name: metadata.donor_name || null,
            message: null,
          });

        if (donationError) {
          console.error('Error creating donation:', donationError);
          throw donationError;
        }

        console.log('Donation record created successfully');
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error);
        
        // Log the failure (could also emit event here)
        console.log('Payment failed for fundraiser:', paymentIntent.metadata.fundraiser_id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Refund processed:', charge.id);

        // Update donation status to refunded
        const { error: refundError } = await supabase
          .from('donations')
          .update({ payment_status: 'refunded' })
          .eq('receipt_id', charge.payment_intent);

        if (refundError) {
          console.error('Error updating refund status:', refundError);
          throw refundError;
        }

        console.log('Donation refund status updated');
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
