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
      eventType, 
      aggregateId, 
      correlationId, 
      fromTimestamp, 
      toTimestamp,
      limit = 100,
      offset = 0
    } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let query = supabase
      .from('event_store')
      .select('*', { count: 'exact' })
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (aggregateId) {
      query = query.eq('aggregate_id', aggregateId);
    }

    if (correlationId) {
      query = query.eq('correlation_id', correlationId);
    }

    if (fromTimestamp) {
      query = query.gte('occurred_at', new Date(fromTimestamp).toISOString());
    }

    if (toTimestamp) {
      query = query.lte('occurred_at', new Date(toTimestamp).toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        events: data,
        total: count,
        limit,
        offset
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Event query error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
