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
    const body = await req.json();
    const { event, events } = body;

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: ProcessorResult[] = [];

    // Process single event or batch
    const eventsToProcess: DomainEvent[] = events || (event ? [event] : []);

    // Validate events array
    if (!Array.isArray(eventsToProcess) || eventsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request: events must be a non-empty array' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each event has required fields
    const validEvents = eventsToProcess.filter(evt => {
      if (!evt?.id || !evt?.type || !evt?.payload) {
        console.error('Skipping invalid event:', evt);
        return false;
      }
      return true;
    });

    console.log(`Processing ${validEvents.length} valid event(s) out of ${eventsToProcess.length}`);

    for (const evt of validEvents) {
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
    case 'campaign.updated':
    case 'campaign.deleted':
    case 'campaign.goal_reached':
    case 'campaign.status_changed':
      await trackCampaignEvent(supabase, event);
      break;
    case 'user.registered':
    case 'user.logged_in':
    case 'user.profile_updated':
      await trackUserEvent(supabase, event);
      break;
    case 'organization.created':
    case 'organization.verified':
    case 'organization.rejected':
    case 'organization.updated':
      await trackOrganizationEvent(supabase, event);
      break;
    case 'admin.user.suspended':
    case 'admin.user.unsuspended':
    case 'admin.user.profile_updated':
    case 'admin.user.deleted':
    case 'admin.campaign.approved':
    case 'admin.campaign.rejected':
    case 'admin.campaign.paused':
    case 'admin.campaign.closed':
      await trackAdminAction(supabase, event);
      break;
    default:
      console.log(`[Analytics] No handler for event type: ${event.type}`);
  }
}

async function updateDonationAnalytics(supabase: any, event: DomainEvent): Promise<void> {
  const { campaignId, amount, userId } = event.payload;

  // Use safe atomic function for campaign analytics
  const { error: campaignError } = await supabase.rpc('update_campaign_analytics_safe', {
    p_campaign_id: campaignId,
    p_amount: amount,
    p_donor_id: userId
  });

  if (campaignError) {
    console.error('Failed to update campaign analytics:', campaignError);
    throw campaignError;
  }

  // Update donor history if user is logged in
  if (userId) {
    const { error: donorError } = await supabase.rpc('update_donor_history_safe', {
      p_user_id: userId,
      p_amount: amount,
      p_campaign_id: campaignId
    });

    if (donorError) {
      console.error('Failed to update donor history:', donorError);
      throw donorError;
    }
  }
}

async function trackCampaignEvent(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Analytics] Campaign event: ${event.type}`, event.payload);
  // Track campaign metrics, status changes, etc.
}

async function trackUserEvent(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Analytics] User event: ${event.type}`, event.payload);
  // Track user activity, profile changes, etc.
}

async function trackOrganizationEvent(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Analytics] Organization event: ${event.type}`, event.payload);
  // Track organization verification, updates, etc.
}

async function trackAdminAction(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Analytics] Admin action: ${event.type}`, event.payload);
  // Track admin operations for compliance and monitoring
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
    case 'admin.user.suspended':
    case 'admin.user.unsuspended':
      await sendUserStatusNotification(supabase, event);
      break;
    case 'admin.campaign.approved':
    case 'admin.campaign.rejected':
      await sendCampaignStatusNotification(supabase, event);
      break;
    case 'organization.verified':
    case 'organization.rejected':
      await sendOrganizationStatusNotification(supabase, event);
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

async function sendUserStatusNotification(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Notifications] User status changed: ${event.type}`, event.payload);
  // TODO: Send user status change notification
}

async function sendCampaignStatusNotification(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Notifications] Campaign status changed: ${event.type}`, event.payload);
  // TODO: Send campaign status change notification
}

async function sendOrganizationStatusNotification(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Notifications] Organization status changed: ${event.type}`, event.payload);
  // TODO: Send organization verification notification
}

// Cache Invalidation Processor
async function processCacheInvalidation(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Cache] Processing event: ${event.type}`);

  switch (event.type) {
    case 'campaign.created':
    case 'campaign.updated':
    case 'campaign.deleted':
    case 'admin.campaign.approved':
    case 'admin.campaign.rejected':
    case 'admin.campaign.paused':
    case 'admin.campaign.closed':
      console.log(`[Cache] Invalidating campaign cache: ${event.payload.campaignId}`);
      break;
    case 'donation.completed':
      console.log(`[Cache] Invalidating campaign stats: ${event.payload.campaignId}`);
      break;
    case 'user.profile_updated':
    case 'admin.user.profile_updated':
    case 'admin.user.suspended':
    case 'admin.user.unsuspended':
      console.log(`[Cache] Invalidating user cache: ${event.payload.userId}`);
      break;
    case 'organization.updated':
    case 'organization.verified':
    case 'organization.rejected':
      console.log(`[Cache] Invalidating organization cache: ${event.payload.organizationId}`);
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
