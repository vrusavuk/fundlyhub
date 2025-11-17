/**
 * Stripe Payout Webhook Edge Function
 * Handles Stripe transfer status updates
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
  });

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_PAYOUT_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return new Response(
      JSON.stringify({ error: 'Webhook configuration error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Received Stripe webhook event:', event.type);

    // Create service role client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        const requestId = transfer.metadata.payout_request_id;

        if (!requestId) {
          console.warn('Transfer created without payout_request_id metadata');
          break;
        }

        console.log('Transfer created for payout:', requestId, transfer.id);
        break;
      }

      case 'transfer.paid': {
        const transfer = event.data.object as Stripe.Transfer;
        const requestId = transfer.metadata.payout_request_id;

        if (!requestId) {
          console.warn('Transfer paid without payout_request_id metadata');
          break;
        }

        // Get payout request
        const { data: payoutRequest, error: fetchError } = await supabase
          .from('payout_requests')
          .select('correlation_id')
          .eq('id', requestId)
          .single();

        if (fetchError) {
          console.error('Failed to fetch payout request:', fetchError);
          break;
        }

        // Create completed event
        const completedEvent = {
          id: crypto.randomUUID(),
          type: 'payout.completed',
          timestamp: Date.now(),
          version: '1.0',
          correlationId: payoutRequest.correlation_id || crypto.randomUUID(),
          payload: {
            requestId,
            stripeTransferId: transfer.id,
            actualArrivalDate: new Date().toISOString().split('T')[0],
            completedAt: new Date().toISOString(),
          },
          metadata: {
            source: 'stripe-payout-webhook',
            aggregateType: 'payout_request',
            aggregateId: requestId,
            stripeEventId: event.id,
          },
        };

        const { error: eventStoreError } = await supabase.from('event_store').insert({
          event_id: completedEvent.id,
          event_type: completedEvent.type,
          event_data: completedEvent.payload,
          event_version: completedEvent.version,
          correlation_id: completedEvent.correlationId,
          occurred_at: new Date(completedEvent.timestamp).toISOString(),
          metadata: completedEvent.metadata,
          aggregate_id: requestId,
        });

        if (eventStoreError) {
          console.error('Failed to store completed event:', eventStoreError);
        } else {
          console.log('Payout completed:', requestId);
        }
        break;
      }

      case 'transfer.failed': {
        const transfer = event.data.object as Stripe.Transfer;
        const requestId = transfer.metadata.payout_request_id;

        if (!requestId) {
          console.warn('Transfer failed without payout_request_id metadata');
          break;
        }

        const { data: payoutRequest, error: fetchError } = await supabase
          .from('payout_requests')
          .select('correlation_id')
          .eq('id', requestId)
          .single();

        if (fetchError) {
          console.error('Failed to fetch payout request:', fetchError);
          break;
        }

        // Create failed event
        const failedEvent = {
          id: crypto.randomUUID(),
          type: 'payout.failed',
          timestamp: Date.now(),
          version: '1.0',
          correlationId: payoutRequest.correlation_id || crypto.randomUUID(),
          payload: {
            requestId,
            failureReason: transfer.failure_message || 'Transfer failed',
            stripeError: transfer.failure_code,
            failedAt: new Date().toISOString(),
            isRetryable: false,
          },
          metadata: {
            source: 'stripe-payout-webhook',
            aggregateType: 'payout_request',
            aggregateId: requestId,
            stripeEventId: event.id,
          },
        };

        const { error: eventStoreError } = await supabase.from('event_store').insert({
          event_id: failedEvent.id,
          event_type: failedEvent.type,
          event_data: failedEvent.payload,
          event_version: failedEvent.version,
          correlation_id: failedEvent.correlationId,
          occurred_at: new Date(failedEvent.timestamp).toISOString(),
          metadata: failedEvent.metadata,
          aggregate_id: requestId,
        });

        if (eventStoreError) {
          console.error('Failed to store failed event:', eventStoreError);
        } else {
          console.log('Payout failed:', requestId, transfer.failure_message);
        }
        break;
      }

      case 'transfer.reversed': {
        const transfer = event.data.object as Stripe.Transfer;
        const requestId = transfer.metadata.payout_request_id;

        if (!requestId) {
          console.warn('Transfer reversed without payout_request_id metadata');
          break;
        }

        console.log('Transfer reversed for payout:', requestId);
        // Could create a payout.reversed event type if needed
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed', details: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
