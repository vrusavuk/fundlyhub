import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache for routing numbers (lasts for the lifetime of the edge function instance)
const routingCache = new Map<string, { bank_name: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

interface RoutingNumberResponse {
  customer_name?: string;
  bank_name?: string;
  name?: string;
}

// Validate routing number checksum (ABA routing number algorithm)
function validateRoutingNumber(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false;
  
  const digits = routing.split('').map(Number);
  const checksum = (
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    (digits[2] + digits[5] + digits[8])
  ) % 10;
  
  return checksum === 0;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { routing_number } = await req.json();

    if (!routing_number) {
      return new Response(
        JSON.stringify({ error: 'Routing number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate format
    const cleanRouting = routing_number.replace(/\D/g, '');
    if (!validateRoutingNumber(cleanRouting)) {
      return new Response(
        JSON.stringify({ error: 'Invalid routing number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache
    const cached = routingCache.get(cleanRouting);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Cache hit for routing number: ${cleanRouting}`);
      return new Response(
        JSON.stringify({ bank_name: cached.bank_name, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Lookup using RoutingNumbers.info API (free, no auth required)
    console.log(`Looking up routing number: ${cleanRouting}`);
    const lookupUrl = `https://www.routingnumbers.info/api/name.json?rn=${cleanRouting}`;
    
    const response = await fetch(lookupUrl, {
      headers: {
        'User-Agent': 'Supabase-Edge-Function',
      },
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: 'Bank lookup service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: RoutingNumberResponse = await response.json();
    const bankName = data.customer_name || data.bank_name || data.name;

    if (!bankName) {
      return new Response(
        JSON.stringify({ error: 'Bank not found for this routing number' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cache the result
    routingCache.set(cleanRouting, {
      bank_name: bankName,
      timestamp: Date.now(),
    });

    console.log(`Found bank: ${bankName}`);
    return new Response(
      JSON.stringify({ bank_name: bankName }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in routing-lookup function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
