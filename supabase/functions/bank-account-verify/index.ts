/**
 * Bank Account Verify Edge Function
 * Handles bank account verification via Stripe
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Bank Account Input Interface
 * 
 * IMPORTANT: This edge function expects camelCase field names.
 * The frontend service layer must transform snake_case to camelCase before calling.
 * 
 * Required fields:
 * - accountHolderName: Full name on the bank account
 * - accountNumber: Bank account number
 * - routingNumber: 9-digit ABA routing number
 * - accountType: Either 'checking' or 'savings'
 * 
 * Optional fields:
 * - bankName: Name of the bank (auto-detected if not provided)
 * - country: ISO country code (defaults to 'US')
 * - currency: ISO currency code (defaults to 'usd')
 */
interface BankAccountInput {
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  bankName?: string;
  country?: string;
  currency?: string;
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

    const input: BankAccountInput = await req.json();

    console.log('Received request body:', JSON.stringify(input, null, 2));

    // Validate input
    if (
      !input.accountHolderName ||
      !input.accountNumber ||
      !input.routingNumber ||
      !input.accountType
    ) {
      const missingFields = [];
      if (!input.accountHolderName) missingFields.push('accountHolderName');
      if (!input.accountNumber) missingFields.push('accountNumber');
      if (!input.routingNumber) missingFields.push('routingNumber');
      if (!input.accountType) missingFields.push('accountType');
      
      console.error('Validation failed. Missing fields:', missingFields);
      console.error('Received fields:', Object.keys(input));
      
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          missing: missingFields,
          received: Object.keys(input)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Create bank account token
    const token = await stripe.tokens.create({
      bank_account: {
        country: input.country || 'US',
        currency: input.currency || 'usd',
        account_holder_name: input.accountHolderName,
        account_holder_type: 'individual',
        routing_number: input.routingNumber,
        account_number: input.accountNumber,
      },
    });

    console.log('Stripe token created:', token.id);

    // Get or create Stripe customer for user
    let customerId: string;

    const { data: existingAccounts } = await supabase
      .from('payout_bank_accounts')
      .select('stripe_external_account_id')
      .eq('user_id', user.id)
      .limit(1);

    if (existingAccounts && existingAccounts.length > 0) {
      // Get customer ID from existing account
      const externalAccount = await stripe.accounts.retrieveExternalAccount(
        'self',
        existingAccounts[0].stripe_external_account_id
      );
      customerId = externalAccount.customer as string;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create external account (bank account)
    const bankAccount = await stripe.customers.createSource(customerId, {
      source: token.id,
    }) as Stripe.BankAccount;

    // Verify bank account using micro-deposits (in production)
    // For now, we'll mark as pending verification
    const bankAccountId = crypto.randomUUID();

    // Store bank account details
    const { error: insertError } = await supabase.from('payout_bank_accounts').insert({
      id: bankAccountId,
      user_id: user.id,
      stripe_external_account_id: bankAccount.id,
      account_holder_name: input.accountHolderName,
      account_number_last4: bankAccount.last4,
      routing_number_last4: bankAccount.routing_number?.slice(-4) || '',
      account_type: input.accountType,
      bank_name: input.bankName || bankAccount.bank_name || 'Unknown Bank',
      country: input.country || 'US',
      currency: input.currency || 'USD',
      verification_status: bankAccount.status === 'verified' ? 'verified' : 'pending',
      verification_method: 'micro_deposits',
      is_active: true,
      is_default: false,
    });

    if (insertError) {
      console.error('Failed to store bank account:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store bank account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create event based on verification status
    const eventType =
      bankAccount.status === 'verified'
        ? 'payout.bank_account.verified'
        : 'payout.bank_account.verification_pending';

    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: Date.now(),
      version: '1.0',
      correlationId: crypto.randomUUID(),
      payload: {
        bankAccountId,
        userId: user.id,
        verificationMethod: 'micro_deposits',
        verifiedAt: bankAccount.status === 'verified' ? new Date().toISOString() : undefined,
      },
      metadata: {
        source: 'bank-account-verify',
        aggregateType: 'bank_account',
        aggregateId: bankAccountId,
      },
    };

    // Store event
    await supabase.from('event_store').insert({
      event_id: event.id,
      event_type: event.type,
      event_data: event.payload,
      event_version: event.version,
      correlation_id: event.correlationId,
      occurred_at: new Date(event.timestamp).toISOString(),
      metadata: event.metadata,
      aggregate_id: bankAccountId,
    });

    console.log('Bank account created successfully:', {
      bankAccountId,
      status: bankAccount.status,
      last4: bankAccount.last4,
      bankName: input.bankName || bankAccount.bank_name || 'Unknown Bank'
    });

    return new Response(
      JSON.stringify({
        success: true,
        bankAccountId,
        last4: bankAccount.last4,
        verificationStatus: bankAccount.status,
        requiresMicroDeposits: bankAccount.status !== 'verified',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying bank account:', error);
    return new Response(
      JSON.stringify({ error: 'Bank account verification failed. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
