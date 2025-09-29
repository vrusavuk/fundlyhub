import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DomainEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  version: string;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, any>;
}

interface ProcessorResult {
  success: boolean;
  processor: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event, events } = await req.json();

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: ProcessorResult[] = [];

    // Process single event or batch
    const eventsToProcess: DomainEvent[] = events || (event ? [event] : []);

    console.log(`Processing ${eventsToProcess.length} event(s)`);

    for (const evt of eventsToProcess) {
      try {
        // Run all processors in parallel
        const processorResults = await Promise.allSettled([
          processAnalytics(supabase, evt),
          processNotifications(supabase, evt),
          processCacheInvalidation(supabase, evt),
          processProjections(supabase, evt),
        ]);

        // Record processing status
        for (let i = 0; i < processorResults.length; i++) {
          const processorName = ['analytics', 'notifications', 'cache', 'projections'][i];
          const result = processorResults[i];

          if (result.status === 'fulfilled') {
            results.push({ success: true, processor: processorName });
            
            // Update processing status
            await supabase.from('event_processing_status').upsert({
              event_id: evt.id,
              processor_name: processorName,
              status: 'completed',
              completed_at: new Date().toISOString(),
            });
          } else {
            console.error(`Processor ${processorName} failed:`, result.reason);
            results.push({ 
              success: false, 
              processor: processorName, 
              error: result.reason?.message 
            });

            // Update processing status as failed
            await supabase.from('event_processing_status').upsert({
              event_id: evt.id,
              processor_name: processorName,
              status: 'failed',
              error_message: result.reason?.message,
              last_attempt_at: new Date().toISOString(),
            });
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error processing event:', errorMessage);
        
        // Add to dead letter queue
        await supabase.from('event_dead_letter_queue').insert({
          original_event_id: evt.id,
          event_data: evt,
          processor_name: 'event-processor',
          failure_reason: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: eventsToProcess.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Event processor error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Analytics Processor
async function processAnalytics(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Analytics] Processing event: ${event.type}`);

  switch (event.type) {
    case 'donation.completed':
      await updateDonationAnalytics(supabase, event);
      break;
    case 'campaign.created':
      await trackCampaignCreation(supabase, event);
      break;
    case 'user.registered':
      await trackUserRegistration(supabase, event);
      break;
    default:
      console.log(`[Analytics] No handler for event type: ${event.type}`);
  }
}

async function updateDonationAnalytics(supabase: any, event: DomainEvent): Promise<void> {
  const { campaignId, amount, userId } = event.payload;

  // Update campaign analytics projection
  const { data: existing } = await supabase
    .from('campaign_analytics_projection')
    .select('*')
    .eq('campaign_id', campaignId)
    .single();

  if (existing) {
    await supabase.from('campaign_analytics_projection').update({
      total_donations: parseFloat(existing.total_donations) + parseFloat(amount),
      donation_count: existing.donation_count + 1,
      last_donation_at: new Date().toISOString(),
      average_donation: (parseFloat(existing.total_donations) + parseFloat(amount)) / (existing.donation_count + 1),
      updated_at: new Date().toISOString(),
    }).eq('campaign_id', campaignId);
  } else {
    await supabase.from('campaign_analytics_projection').insert({
      campaign_id: campaignId,
      total_donations: amount,
      donation_count: 1,
      unique_donors: 1,
      first_donation_at: new Date().toISOString(),
      last_donation_at: new Date().toISOString(),
      average_donation: amount,
    });
  }

  // Update donor history if user is logged in
  if (userId) {
    const { data: donorHistory } = await supabase
      .from('donor_history_projection')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (donorHistory) {
      await supabase.from('donor_history_projection').update({
        total_donated: parseFloat(donorHistory.total_donated) + parseFloat(amount),
        donation_count: donorHistory.donation_count + 1,
        last_donation_at: new Date().toISOString(),
        average_donation: (parseFloat(donorHistory.total_donated) + parseFloat(amount)) / (donorHistory.donation_count + 1),
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);
    } else {
      await supabase.from('donor_history_projection').insert({
        user_id: userId,
        total_donated: amount,
        donation_count: 1,
        campaigns_supported: 1,
        first_donation_at: new Date().toISOString(),
        last_donation_at: new Date().toISOString(),
        average_donation: amount,
      });
    }
  }
}

async function trackCampaignCreation(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Analytics] Campaign created: ${event.payload.campaignId}`);
  // Additional analytics tracking can be added here
}

async function trackUserRegistration(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Analytics] User registered: ${event.payload.userId}`);
  // Additional analytics tracking can be added here
}

// Notifications Processor
async function processNotifications(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Notifications] Processing event: ${event.type}`);

  switch (event.type) {
    case 'donation.completed':
      await sendDonationNotification(supabase, event);
      break;
    case 'campaign.goal_reached':
      await sendGoalReachedNotification(supabase, event);
      break;
    default:
      console.log(`[Notifications] No handler for event type: ${event.type}`);
  }
}

async function sendDonationNotification(supabase: any, event: DomainEvent): Promise<void> {
  const { campaignId, amount } = event.payload;

  // Get campaign owner
  const { data: campaign } = await supabase
    .from('fundraisers')
    .select('owner_user_id, title')
    .eq('id', campaignId)
    .single();

  if (campaign) {
    console.log(`[Notifications] Would send email to campaign owner about $${amount} donation`);
    // TODO: Integrate with email service (Resend)
  }
}

async function sendGoalReachedNotification(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Notifications] Campaign reached goal: ${event.payload.campaignId}`);
  // TODO: Send celebration email
}

// Cache Invalidation Processor
async function processCacheInvalidation(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Cache] Processing event: ${event.type}`);

  switch (event.type) {
    case 'campaign.updated':
    case 'campaign.created':
      console.log(`[Cache] Invalidating campaign cache: ${event.payload.campaignId}`);
      break;
    case 'donation.completed':
      console.log(`[Cache] Invalidating campaign stats: ${event.payload.campaignId}`);
      break;
    default:
      console.log(`[Cache] No cache invalidation for event type: ${event.type}`);
  }
}

// Projections Processor
async function processProjections(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Projections] Processing event: ${event.type}`);
  // Projections are handled in analytics processor for now
}
