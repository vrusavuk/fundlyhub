/**
 * Payout Process Edge Function
 * Handles admin-facing payout approval/denial and Stripe transfer initiation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayoutProcessInput {
  requestId: string;
  action: 'approve' | 'deny' | 'info_required';
  reason?: string;
  adminNotes?: string;
  requiredInfo?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin permissions
    const { data: hasPermission, error: permError } = await supabase.rpc(
      'user_has_permission',
      {
        _user_id: user.id,
        _permission_name: 'manage_payouts',
      }
    );

    if (permError || !hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const input: PayoutProcessInput = await req.json();

    if (!input.requestId || !input.action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payout request details
    const { data: payoutRequest, error: fetchError } = await supabase
      .from('payout_requests')
      .select('*, payout_bank_accounts(*)')
      .eq('id', input.requestId)
      .single();

    if (fetchError || !payoutRequest) {
      return new Response(
        JSON.stringify({ error: 'Payout request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payoutRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Payout request is not in pending status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();
    let event: any;

    if (input.action === 'approve') {
      // Create approved event
      event = {
        id: crypto.randomUUID(),
        type: 'payout.approved',
        timestamp: Date.now(),
        version: '1.0',
        correlationId: payoutRequest.correlation_id || crypto.randomUUID(),
        payload: {
          requestId: input.requestId,
          approvedBy: user.id,
          adminNotes: input.adminNotes,
          approvedAt: now,
        },
        metadata: {
          source: 'payout-process',
          aggregateType: 'payout_request',
          aggregateId: input.requestId,
        },
      };

      // Initiate Stripe transfer
      try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
          apiVersion: '2023-10-16',
        });

        const transfer = await stripe.transfers.create({
          amount: Math.round(parseFloat(payoutRequest.net_amount_str) * 100),
          currency: payoutRequest.currency.toLowerCase(),
          destination: payoutRequest.payout_bank_accounts.stripe_external_account_id,
          description: `Payout for request ${input.requestId}`,
          metadata: {
            payout_request_id: input.requestId,
            user_id: payoutRequest.user_id,
          },
        });

        // Create processing event
        const processingEvent = {
          id: crypto.randomUUID(),
          type: 'payout.processing',
          timestamp: Date.now(),
          version: '1.0',
          correlationId: payoutRequest.correlation_id || crypto.randomUUID(),
          payload: {
            requestId: input.requestId,
            stripeTransferId: transfer.id,
            estimatedArrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          },
          metadata: {
            source: 'payout-process',
            aggregateType: 'payout_request',
            aggregateId: input.requestId,
          },
        };

        // Store both events
        await supabase.from('event_store').insert([
          {
            event_id: event.id,
            event_type: event.type,
            event_data: event.payload,
            event_version: event.version,
            correlation_id: event.correlationId,
            occurred_at: new Date(event.timestamp).toISOString(),
            metadata: event.metadata,
            aggregate_id: input.requestId,
          },
          {
            event_id: processingEvent.id,
            event_type: processingEvent.type,
            event_data: processingEvent.payload,
            event_version: processingEvent.version,
            correlation_id: processingEvent.correlationId,
            occurred_at: new Date(processingEvent.timestamp).toISOString(),
            metadata: processingEvent.metadata,
            aggregate_id: input.requestId,
          },
        ]);

        console.log('Payout approved and Stripe transfer initiated:', transfer.id);

        return new Response(
          JSON.stringify({
            success: true,
            action: 'approved',
            stripeTransferId: transfer.id,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (stripeError) {
        console.error('Stripe transfer failed:', stripeError);

        // Create failed event
        const failedEvent = {
          id: crypto.randomUUID(),
          type: 'payout.failed',
          timestamp: Date.now(),
          version: '1.0',
          correlationId: payoutRequest.correlation_id || crypto.randomUUID(),
          payload: {
            requestId: input.requestId,
            failureReason: stripeError.message,
            stripeError: stripeError.code,
            failedAt: new Date().toISOString(),
            isRetryable: stripeError.type === 'StripeConnectionError',
          },
          metadata: {
            source: 'payout-process',
            aggregateType: 'payout_request',
            aggregateId: input.requestId,
          },
        };

        await supabase.from('event_store').insert({
          event_id: failedEvent.id,
          event_type: failedEvent.type,
          event_data: failedEvent.payload,
          event_version: failedEvent.version,
          correlation_id: failedEvent.correlationId,
          occurred_at: new Date(failedEvent.timestamp).toISOString(),
          metadata: failedEvent.metadata,
          aggregate_id: input.requestId,
        });

        return new Response(
          JSON.stringify({ error: 'Transfer processing failed. Please try again or contact support.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (input.action === 'deny') {
      if (!input.reason) {
        return new Response(
          JSON.stringify({ error: 'Denial reason is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      event = {
        id: crypto.randomUUID(),
        type: 'payout.denied',
        timestamp: Date.now(),
        version: '1.0',
        correlationId: payoutRequest.correlation_id || crypto.randomUUID(),
        payload: {
          requestId: input.requestId,
          deniedBy: user.id,
          denialReason: input.reason,
          adminNotes: input.adminNotes,
          deniedAt: now,
        },
        metadata: {
          source: 'payout-process',
          aggregateType: 'payout_request',
          aggregateId: input.requestId,
        },
      };
    } else if (input.action === 'info_required') {
      if (!input.reason || !input.requiredInfo) {
        return new Response(
          JSON.stringify({ error: 'Message and required info are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      event = {
        id: crypto.randomUUID(),
        type: 'payout.info_required',
        timestamp: Date.now(),
        version: '1.0',
        correlationId: payoutRequest.correlation_id || crypto.randomUUID(),
        payload: {
          requestId: input.requestId,
          message: input.reason,
          requiredInfo: input.requiredInfo,
        },
        metadata: {
          source: 'payout-process',
          aggregateType: 'payout_request',
          aggregateId: input.requestId,
        },
      };
    }

    // Store event
    const { error: eventStoreError } = await supabase.from('event_store').insert({
      event_id: event.id,
      event_type: event.type,
      event_data: event.payload,
      event_version: event.version,
      correlation_id: event.correlationId,
      occurred_at: new Date(event.timestamp).toISOString(),
      metadata: event.metadata,
      aggregate_id: input.requestId,
    });

    if (eventStoreError) {
      console.error('Failed to store event:', eventStoreError);
      return new Response(
        JSON.stringify({ error: 'Failed to process payout' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Payout ${input.action}:`, input.requestId);

    return new Response(
      JSON.stringify({ success: true, action: input.action }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing payout:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process payout. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
