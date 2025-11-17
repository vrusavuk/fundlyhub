/**
 * Payout Request Create Edge Function
 * Handles creator-facing payout request submissions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayoutRequestInput {
  fundraiserId?: string;
  bankAccountId: string;
  amount: string; // string to avoid precision loss
  currency: string;
  creatorNotes?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
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

    // Parse request body
    const input: PayoutRequestInput = await req.json();

    // Validate input
    if (!input.bankAccountId || !input.amount || !input.currency) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify bank account ownership
    const { data: bankAccount, error: bankError } = await supabase
      .from('payout_bank_accounts')
      .select('id, verification_status, is_active, user_id')
      .eq('id', input.bankAccountId)
      .eq('user_id', user.id)
      .single();

    if (bankError || !bankAccount) {
      return new Response(
        JSON.stringify({ error: 'Bank account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (bankAccount.verification_status !== 'verified' || !bankAccount.is_active) {
      return new Response(
        JSON.stringify({ error: 'Bank account not verified or inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate available balance
    const { data: balanceData, error: balanceError } = await supabase.rpc(
      'calculate_available_balance',
      {
        _fundraiser_id: input.fundraiserId || null,
        _user_id: user.id,
      }
    );

    if (balanceError || !balanceData || balanceData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to calculate available balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const availableBalance = parseFloat(balanceData[0].available_balance);
    const requestedAmount = parseFloat(input.amount);

    if (requestedAmount > availableBalance) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient balance',
          availableBalance: availableBalance.toString(),
          requestedAmount: input.amount,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is first payout
    const { data: previousPayouts, error: payoutCheckError } = await supabase
      .from('payout_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .limit(1);

    if (payoutCheckError) {
      console.error('Error checking previous payouts:', payoutCheckError);
    }

    const isFirstPayout = !previousPayouts || previousPayouts.length === 0;

    // Calculate risk score
    const { data: riskScore, error: riskError } = await supabase.rpc(
      'calculate_payout_risk_score',
      {
        _user_id: user.id,
        _fundraiser_id: input.fundraiserId || null,
        _amount: requestedAmount,
      }
    );

    if (riskError) {
      console.error('Error calculating risk score:', riskError);
    }

    const calculatedRiskScore = riskError ? 50 : (riskScore || 50);

    // Calculate fees (2.9% platform fee)
    const feeAmount = (requestedAmount * 0.029).toFixed(2);
    const netAmount = (requestedAmount - parseFloat(feeAmount)).toFixed(2);

    // Create payout request ID
    const requestId = crypto.randomUUID();

    // Create event payload
    const eventPayload = {
      requestId,
      userId: user.id,
      fundraiserId: input.fundraiserId || null,
      bankAccountId: input.bankAccountId,
      amountStr: netAmount,
      currency: input.currency,
      creatorNotes: input.creatorNotes,
      isFirstPayout,
      riskScore: calculatedRiskScore,
    };

    // Publish payout.requested event
    const event = {
      id: crypto.randomUUID(),
      type: 'payout.requested',
      timestamp: Date.now(),
      version: '1.0',
      correlationId: crypto.randomUUID(),
      payload: eventPayload,
      metadata: {
        source: 'payout-request-create',
        aggregateType: 'payout_request',
        aggregateId: requestId,
      },
    };

    // Store event in event_store
    const { error: eventStoreError } = await supabase.from('event_store').insert({
      event_id: event.id,
      event_type: event.type,
      event_data: event.payload,
      event_version: event.version,
      correlation_id: event.correlationId,
      occurred_at: new Date(event.timestamp).toISOString(),
      metadata: event.metadata,
      aggregate_id: requestId,
    });

    if (eventStoreError) {
      console.error('Failed to store event:', eventStoreError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payout request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payout request created:', requestId);

    return new Response(
      JSON.stringify({
        success: true,
        requestId,
        netAmount,
        feeAmount,
        status: 'pending',
        isFirstPayout,
        riskScore: calculatedRiskScore,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing payout request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
