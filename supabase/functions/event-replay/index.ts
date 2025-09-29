import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      fromTimestamp, 
      toTimestamp, 
      eventTypes,
      aggregateId,
      dryRun = true
    } = await req.json();

    console.log('Starting event replay', { 
      fromTimestamp, 
      toTimestamp, 
      eventTypes,
      dryRun 
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Build query for events to replay
    let query = supabase
      .from('event_store')
      .select('*')
      .order('occurred_at', { ascending: true });

    if (fromTimestamp) {
      query = query.gte('occurred_at', new Date(fromTimestamp).toISOString());
    }

    if (toTimestamp) {
      query = query.lte('occurred_at', new Date(toTimestamp).toISOString());
    }

    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes);
    }

    if (aggregateId) {
      query = query.eq('aggregate_id', aggregateId);
    }

    const { data: events, error } = await query;

    if (error) {
      throw error;
    }

    console.log(`Found ${events?.length || 0} events to replay`);

    if (dryRun) {
      return new Response(
        JSON.stringify({ 
          success: true,
          dryRun: true,
          eventsToReplay: events?.length || 0,
          events: events?.map(e => ({
            id: e.event_id,
            type: e.event_type,
            timestamp: e.occurred_at
          }))
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Actually replay the events by re-processing them
    const replayedEvents = [];
    const errors = [];

    for (const event of events || []) {
      try {
        // Invoke event processor for each event
        const { error: processingError } = await supabase.functions.invoke('event-processor', {
          body: {
            event: {
              id: event.event_id,
              type: event.event_type,
              payload: event.event_data,
              timestamp: new Date(event.occurred_at).getTime(),
              version: event.event_version,
              correlationId: event.correlation_id,
              causationId: event.causation_id,
              metadata: event.metadata
            }
          }
        });

        if (processingError) {
          errors.push({
            eventId: event.event_id,
            error: processingError.message
          });
        } else {
          replayedEvents.push(event.event_id);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({
          eventId: event.event_id,
          error: errorMessage
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        dryRun: false,
        eventsReplayed: replayedEvents.length,
        replayedEvents,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Event replay error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
