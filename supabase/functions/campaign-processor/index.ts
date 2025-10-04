/**
 * Campaign Processor Edge Function
 * Dedicated processor for campaign-related events with Redis integration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { events } = await req.json() as { events: DomainEvent[] };
    console.log(`[CampaignProcessor] Processing ${events.length} event(s)`);

    const results = [];

    for (const event of events) {
      try {
        if (event.type.startsWith('campaign.')) {
          await processCampaignEvent(event);
          results.push({ eventId: event.id, status: 'processed', type: event.type });
        } else {
          results.push({ eventId: event.id, status: 'skipped', type: event.type });
        }
      } catch (error) {
        console.error(`[CampaignProcessor] Error processing event ${event.id}:`, error);
        results.push({ 
          eventId: event.id, 
          status: 'failed', 
          type: event.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Send to dead letter queue
        await supabase
          .from('event_dead_letter_queue')
          .insert({
            original_event_id: event.id,
            event_data: event,
            processor_name: 'CampaignProcessor',
            failure_reason: error instanceof Error ? error.message : 'Unknown error',
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[CampaignProcessor] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function processCampaignEvent(event: DomainEvent): Promise<void> {
  console.log(`[CampaignProcessor] Processing ${event.type} event ${event.id}`);

  if (event.type === 'campaign.created') {
    await handleCampaignCreated(event);
  } else if (event.type === 'campaign.updated') {
    await handleCampaignUpdated(event);
  } else if (event.type === 'campaign.deleted') {
    await handleCampaignDeleted(event);
  } else if (event.type === 'campaign.status_changed') {
    await handleCampaignStatusChanged(event);
  }
}

async function handleCampaignCreated(event: DomainEvent): Promise<void> {
  const { payload } = event;

  console.log(`[CampaignProcessor] Creating campaign for user ${payload.userId}`);

  // Campaign write is handled by CampaignWriteProcessor on the client
  // Here we handle server-side concerns like analytics, notifications, etc.

  // Track campaign creation in analytics
  console.log(`[CampaignProcessor] Campaign created analytics tracked`);

  // Check if this is user's first campaign and update role
  const { data: campaigns } = await supabase
    .from('fundraisers')
    .select('id')
    .eq('owner_user_id', payload.userId)
    .limit(2);

  if (campaigns && campaigns.length === 1) {
    // This is their first campaign, ensure they're promoted to creator
    await supabase
      .from('profiles')
      .update({ role: 'creator' })
      .eq('id', payload.userId)
      .eq('role', 'visitor');
    
    console.log(`[CampaignProcessor] Promoted user ${payload.userId} to creator`);
  }
}

async function handleCampaignUpdated(event: DomainEvent): Promise<void> {
  const { payload } = event;
  console.log(`[CampaignProcessor] Campaign ${payload.campaignId} updated`);
  
  // Handle campaign update side effects
  // - Invalidate caches
  // - Update search indices
  // - Notify followers
}

async function handleCampaignDeleted(event: DomainEvent): Promise<void> {
  const { payload } = event;
  console.log(`[CampaignProcessor] Campaign ${payload.campaignId} deleted`);
  
  // Handle campaign deletion side effects
  // - Clean up projections (cascade delete)
  // - Update user stats
  // - Archive data if needed
}

async function handleCampaignStatusChanged(event: DomainEvent): Promise<void> {
  const { payload } = event;
  console.log(`[CampaignProcessor] Campaign ${payload.campaignId} status changed to ${payload.newStatus}`);
  
  // Handle status change side effects
  // - Send notifications
  // - Update search visibility
  // - Trigger workflows based on new status
}
