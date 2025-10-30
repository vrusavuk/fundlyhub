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
      // Use async method for Deno compatibility
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
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

        console.log('Processing payment:', {
          paymentIntentId: paymentIntent.id,
          fundraiserId: metadata.fundraiser_id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          timestamp: new Date().toISOString()
        });

        // Check for duplicate processing (idempotency)
        const { data: existingDonation } = await supabase
          .from('donations')
          .select('id')
          .eq('receipt_id', paymentIntent.id)
          .single();

        if (existingDonation) {
          console.log('Donation already processed:', paymentIntent.id);
          return new Response(
            JSON.stringify({ received: true, duplicate: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const donationAmount = parseInt(metadata.donation_amount || '0');
        const tipAmount = parseInt(metadata.tip_amount || '0');
        const totalAmount = paymentIntent.amount;
        const stripeFee = Math.round(totalAmount * 0.029 + 30);
        const netAmount = totalAmount - stripeFee;

        // Create donation record
        const { data: donation, error: donationError } = await supabase
          .from('donations')
          .insert({
            fundraiser_id: metadata.fundraiser_id,
            donor_user_id: null, // Anonymous or will be linked later
            amount: donationAmount / 100,
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
            message: metadata.message || null,
          })
          .select('id')
          .single();

        if (donationError) {
          console.error('Error creating donation:', donationError);
          
          // Log to dead letter queue for retry
          await supabase.from('event_dead_letter_queue').insert({
            original_event_id: event.id,
            event_data: event,
            failure_reason: donationError.message,
            processor_name: 'stripe-webhook',
            failure_count: 1
          });
          
          throw donationError;
        }

        console.log('Donation record created successfully:', donation.id);

        // Publish donation.completed event for event-driven processing
        try {
          const donationEvent = {
            id: crypto.randomUUID(),
            type: 'donation.completed',
            timestamp: Date.now(),
            version: '1.0.0',
            payload: {
              donationId: donation.id,
              campaignId: metadata.fundraiser_id,
              donorId: undefined,
              amount: donationAmount / 100,
              currency: paymentIntent.currency.toUpperCase(),
              processingFee: stripeFee / 100,
              netAmount: netAmount / 100,
              paymentProvider: 'stripe',
              transactionId: paymentIntent.id,
              isAnonymous: metadata.is_anonymous === 'true',
              donorEmail: metadata.donor_email,
              donorName: metadata.donor_name,
            }
          };

          // Store event in event_store
          const { error: eventStoreError } = await supabase
            .from('event_store')
            .insert({
              event_id: donationEvent.id,
              event_type: donationEvent.type,
              event_data: donationEvent.payload,
              aggregate_id: metadata.fundraiser_id,
              event_version: donationEvent.version,
              occurred_at: new Date(donationEvent.timestamp).toISOString(),
            });

          if (eventStoreError) {
            console.error('Failed to store donation.completed event:', eventStoreError);
          } else {
            console.log('donation.completed event stored successfully');
          }
        } catch (eventErr) {
          console.error('Error publishing event:', eventErr);
          // Continue - donation is recorded even if event fails
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;
        
        console.error('Payment failed:', {
          paymentIntentId: paymentIntent.id,
          fundraiserId: metadata.fundraiser_id,
          error: paymentIntent.last_payment_error?.message,
          code: paymentIntent.last_payment_error?.code,
        });
        
        // Publish donation.failed event
        try {
          const failedEvent = {
            id: crypto.randomUUID(),
            type: 'donation.failed',
            timestamp: Date.now(),
            version: '1.0.0',
            payload: {
              donationId: paymentIntent.id,
              campaignId: metadata.fundraiser_id,
              donorId: undefined,
              amount: paymentIntent.amount / 100,
              reason: paymentIntent.last_payment_error?.message || 'Unknown error',
              errorCode: paymentIntent.last_payment_error?.code || 'unknown',
              retryable: paymentIntent.last_payment_error?.type === 'card_error',
            }
          };

          await supabase.from('event_store').insert({
            event_id: failedEvent.id,
            event_type: failedEvent.type,
            event_data: failedEvent.payload,
            aggregate_id: metadata.fundraiser_id,
            event_version: failedEvent.version,
            occurred_at: new Date(failedEvent.timestamp).toISOString(),
          });

          console.log('donation.failed event stored');
        } catch (eventErr) {
          console.error('Error storing failed event:', eventErr);
        }
        
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Refund processed:', charge.id);

        // Update donation status to refunded
        const { data: updatedDonation, error: refundError } = await supabase
          .from('donations')
          .update({ payment_status: 'refunded' })
          .eq('receipt_id', charge.payment_intent)
          .select('id, fundraiser_id, amount')
          .single();

        if (refundError) {
          console.error('Error updating refund status:', refundError);
          throw refundError;
        }

        console.log('Donation refund status updated');

        // Publish donation.refunded event
        if (updatedDonation) {
          try {
            const refundEvent = {
              id: crypto.randomUUID(),
              type: 'donation.refunded',
              timestamp: Date.now(),
              version: '1.0.0',
              payload: {
                donationId: updatedDonation.id,
                campaignId: updatedDonation.fundraiser_id,
                originalAmount: updatedDonation.amount,
                refundAmount: charge.amount_refunded / 100,
                reason: 'Refund processed via Stripe',
                refundTransactionId: charge.id,
                initiatedBy: charge.metadata?.refund_initiated_by || 'system',
              }
            };

            await supabase.from('event_store').insert({
              event_id: refundEvent.id,
              event_type: refundEvent.type,
              event_data: refundEvent.payload,
              aggregate_id: updatedDonation.fundraiser_id,
              event_version: refundEvent.version,
              occurred_at: new Date(refundEvent.timestamp).toISOString(),
            });

            console.log('donation.refunded event stored');
          } catch (eventErr) {
            console.error('Error storing refund event:', eventErr);
          }
        }

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
