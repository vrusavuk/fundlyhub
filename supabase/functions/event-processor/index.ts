import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Redis } from "https://esm.sh/@upstash/redis@1.35.4";

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

    // Initialize Redis client for distributed event streaming
    let redis: Redis | null = null;
    try {
      redis = new Redis({
        url: Deno.env.get('UPSTASH_REDIS_REST_URL') ?? '',
        token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? '',
      });
      console.log('[Redis] Client initialized');
    } catch (redisError) {
      console.error('[Redis] Failed to initialize:', redisError);
      // Continue without Redis if it fails
    }

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

    // Publish events to Redis stream for distributed processing
    if (redis) {
      for (const evt of eventsToProcess) {
        try {
          await redis.xadd('events:stream', '*', {
            id: evt.id,
            type: evt.type,
            payload: JSON.stringify(evt.payload),
            timestamp: evt.timestamp.toString(),
            version: evt.version,
            correlationId: evt.correlationId || '',
          });
          console.log(`[Redis] Published event ${evt.id} to stream`);
        } catch (redisError) {
          console.error(`[Redis] Failed to publish event ${evt.id}:`, redisError);
          // Continue processing even if Redis fails
        }
      }
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
    case 'admin.user.role_assigned':
    case 'admin.role.created':
    case 'admin.role.permissions_updated':
      await trackRoleEvent(supabase, event);
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

async function trackRoleEvent(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Analytics] Role event: ${event.type}`, event.payload);
  // Track role changes for compliance and audit
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
    case 'campaign.updated':
      await sendCampaignEditNotification(supabase, event);
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
    case 'admin.user.role_assigned':
      await sendRoleChangeNotification(supabase, event);
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

async function sendCampaignEditNotification(supabase: any, event: DomainEvent): Promise<void> {
  const { campaignId, userId, changes, previousValues } = event.payload;
  const ownerId = previousValues?.ownerId;

  // Only send notification if admin edited someone else's campaign
  if (ownerId && userId !== ownerId) {
    console.log(`[Notifications] Admin ${userId} edited campaign ${campaignId} owned by ${ownerId}`);
    // TODO: Send email notification to campaign owner about admin changes
    // Include: which fields were changed, reason for change
  }
}

async function sendRoleChangeNotification(supabase: any, event: DomainEvent): Promise<void> {
  const { userId, roleName } = event.payload;
  
  console.log(`[Notifications] User ${userId} role changed to ${roleName}`);
  // TODO: Send email notification to user about role change
  // TODO: Send notification to admins for audit trail
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
    case 'admin.user.role_assigned':
    case 'admin.role.permissions_updated':
      console.log(`[Cache] Invalidating RBAC cache for user: ${event.payload.userId || 'all'}`);
      break;
    default:
      console.log(`[Cache] No cache invalidation for event type: ${event.type}`);
  }
}

// Projections Processor
async function processProjections(supabase: any, event: DomainEvent): Promise<void> {
  console.log(`[Projections] Processing event: ${event.type}`);
  
  switch (event.type) {
    case 'campaign.status_changed':
      await updateCampaignStatus(supabase, event);
      break;
    case 'campaign.updated':
      await handleCampaignUpdated(supabase, event);
      break;
    case 'admin.user.role_assigned':
      await handleRoleAssigned(supabase, event);
      break;
    case 'admin.role.created':
      await handleRoleCreated(supabase, event);
      break;
    case 'admin.role.permissions_updated':
      await handleRolePermissionsUpdated(supabase, event);
      break;
    default:
      // Other projections are handled in analytics processor
      break;
  }
}

async function updateCampaignStatus(supabase: any, event: DomainEvent): Promise<void> {
  const { campaignId, newStatus, reason } = event.payload;
  
  console.log(`[Projections] Updating campaign ${campaignId} status to ${newStatus}`);
  
  const { error } = await supabase
    .from('fundraisers')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', campaignId);
  
  if (error) {
    console.error(`[Projections] Failed to update campaign status:`, error);
    throw error;
  }
  
  console.log(`[Projections] Campaign status updated successfully. Reason: ${reason || 'N/A'}`);
}

async function handleCampaignUpdated(supabase: any, event: DomainEvent): Promise<void> {
  const { campaignId, userId, changes, previousValues } = event.payload;
  
  console.log(`[Projections] Handling campaign.updated event for campaign ${campaignId}`);
  
  // 1. Update campaign search projection
  const { data: campaign } = await supabase
    .from('fundraisers')
    .select('title, slug, summary, story_html, beneficiary_name, location, tags, status, visibility')
    .eq('id', campaignId)
    .single();

  if (campaign) {
    await supabase
      .from('campaign_search_projection')
      .upsert({
        campaign_id: campaignId,
        title: campaign.title,
        slug: campaign.slug,
        summary: campaign.summary,
        story_text: campaign.story_html?.replace(/<[^>]*>/g, ''),
        beneficiary_name: campaign.beneficiary_name,
        location: campaign.location,
        tags: campaign.tags,
        status: campaign.status,
        visibility: campaign.visibility,
        updated_at: new Date().toISOString(),
      });

    console.log('[Projections] Campaign search projection updated');
  }

  // 2. Invalidate cache entries for this campaign
  await supabase
    .from('search_results_cache')
    .delete()
    .or(`query.ilike.%${campaign?.title}%,query.ilike.%${campaign?.slug}%`);

  console.log('[Projections] Cache invalidated for campaign');

  // 3. Check if this was an admin edit and notify owner if needed
  const ownerId = previousValues?.ownerId;
  if (ownerId && userId !== ownerId) {
    console.log('[Projections] Admin edited campaign, owner notification needed');
    // Notification will be handled by notifications processor
  }

  console.log(`[Projections] Campaign ${campaignId} projections updated successfully`);
}

// Role Management Projection Handlers
async function handleRoleAssigned(supabase: any, event: DomainEvent): Promise<void> {
  const { userId, roleId, contextType, contextId } = event.payload;

  // Check if assignment exists
  const { data: existing } = await supabase
    .from('user_role_assignments')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .maybeSingle();

  if (existing) {
    if (!existing.is_active) {
      await supabase
        .from('user_role_assignments')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    }
  } else {
    await supabase
      .from('user_role_assignments')
      .insert({
        user_id: userId,
        role_id: roleId,
        context_type: contextType,
        context_id: contextId,
        is_active: true,
      });
  }

  console.log(`[Projections] Assigned role ${roleId} to user ${userId}`);
}

async function handleRoleCreated(supabase: any, event: DomainEvent): Promise<void> {
  const { roleId, name, displayName, description, hierarchyLevel, isSystemRole } = event.payload;

  await supabase
    .from('roles')
    .insert({
      id: roleId,
      name,
      display_name: displayName,
      description,
      hierarchy_level: hierarchyLevel,
      is_system_role: isSystemRole,
    });

  console.log(`[Projections] Created role: ${name} (${roleId})`);
}

async function handleRolePermissionsUpdated(supabase: any, event: DomainEvent): Promise<void> {
  const { roleId, addedPermissions, removedPermissions } = event.payload;

  // Remove old permissions
  if (removedPermissions.length > 0) {
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .in('permission_id', removedPermissions);
  }

  // Add new permissions
  if (addedPermissions.length > 0) {
    const newPerms = addedPermissions.map((permId: string) => ({
      role_id: roleId,
      permission_id: permId,
    }));

    await supabase
      .from('role_permissions')
      .insert(newPerms);
  }

  console.log(`[Projections] Updated role permissions: +${addedPermissions.length} -${removedPermissions.length}`);
}
