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

    // Multi-source lookup with intelligent fallback
    console.log(`Looking up routing number: ${cleanRouting}`);
    
    let bankName: string | null = null;
    let source = 'none';

    // Source 1: RoutingNumbers.info (fast, good coverage - returns JSON)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`https://www.routingnumbers.info/api/name.json?rn=${cleanRouting}`, {
        headers: { 'User-Agent': 'Supabase-Edge-Function' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data: RoutingNumberResponse = await response.json();
          bankName = data.customer_name || data.bank_name || data.name || null;
          if (bankName) {
            source = 'routingnumbers.info';
            console.log(`Found via routingnumbers.info: ${bankName}`);
          }
        }
      }
    } catch (error) {
      console.log(`RoutingNumbers.info lookup failed:`, error);
    }

    // Source 2: bank.codes (comprehensive web scraping fallback - returns HTML)
    if (!bankName) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`https://bank.codes/us-routing-number/${cleanRouting}/`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Function)' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const html = await response.text();
          
          // Parse bank name from HTML - look for various patterns
          const patterns = [
            /<h1[^>]*class="[^"]*bank-name[^"]*"[^>]*>(.*?)<\/h1>/i,
            /<h1[^>]*>(.*?)<\/h1>/i,
            /<div[^>]*class="[^"]*bank-name[^"]*"[^>]*>(.*?)<\/div>/i,
            /<span[^>]*class="[^"]*bank-name[^"]*"[^>]*>(.*?)<\/span>/i,
          ];
          
          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              bankName = match[1]
                .trim()
                .replace(/<[^>]*>/g, '') // Remove any HTML tags
                .replace(/,\s*\w{2}$/i, '') // Remove state suffix like ", CA"
                .replace(/\s+/g, ' '); // Normalize whitespace
              
              if (bankName && bankName.length > 2) {
                source = 'bank.codes';
                console.log(`Found via bank.codes: ${bankName}`);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.log(`bank.codes lookup failed:`, error);
      }
    }

    // Source 3: RoutingTool (additional coverage - returns HTML)
    if (!bankName) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`https://verify.routingtool.com/bank/info/routing/${cleanRouting}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Function)' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const html = await response.text();
          
          // Parse bank name from HTML
          const patterns = [
            /"bank_name":"([^"]+)"/i,
            /"name":"([^"]+)"/i,
            /<td[^>]*>Bank Name<\/td>\s*<td[^>]*>(.*?)<\/td>/i,
          ];
          
          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              bankName = match[1]
                .trim()
                .replace(/\\"/g, '"')
                .replace(/<[^>]*>/g, '')
                .replace(/\s+/g, ' ');
              
              if (bankName && bankName.length > 2) {
                source = 'routingtool';
                console.log(`Found via routingtool: ${bankName}`);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.log(`RoutingTool lookup failed:`, error);
      }
    }

    // Return result (verified or unverified)
    if (bankName) {
      // Cache successful result
      routingCache.set(cleanRouting, {
        bank_name: bankName,
        timestamp: Date.now(),
      });

      console.log(`Successfully found bank: ${bankName} (source: ${source})`);
      return new Response(
        JSON.stringify({ 
          bank_name: bankName,
          verified: true,
          source: source 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // All sources failed - return unverified but don't block user
      console.log(`No bank found for routing number: ${cleanRouting}`);
      return new Response(
        JSON.stringify({ 
          bank_name: null,
          verified: false,
          error: 'Unable to verify bank. Please verify your bank details manually.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in routing-lookup function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
