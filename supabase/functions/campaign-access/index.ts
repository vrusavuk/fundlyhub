import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { publishEvent } from "../_shared/publishEvent.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(s: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id, link_token, passcode, contact } = await req.json();

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ allow: false, reason: 'missing_campaign_id' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch campaign with service role
    const { data: c, error: fetchError } = await supabase
      .from("fundraisers")
      .select("id, visibility, passcode_hash, link_token")
      .eq("id", campaign_id)
      .single();

    if (fetchError || !c) {
      console.error('[campaign-access] Campaign not found:', campaign_id);
      return new Response(
        JSON.stringify({ allow: false, reason: "not_found" }), 
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Public campaigns are always accessible
    if (c.visibility === "public") {
      await publishEvent("campaign.access.checked", { campaign_id, allowed: true, method: 'public' });
      return new Response(
        JSON.stringify({ allow: true }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Unlisted: link only (no discovery but open with link)
    if (c.visibility === "unlisted") {
      const ok = link_token && link_token === c.link_token;
      await publishEvent("campaign.access.checked", { 
        campaign_id, 
        allowed: ok, 
        method: ok ? 'link_token' : 'denied' 
      });
      
      return new Response(
        JSON.stringify({ allow: ok, reason: ok ? undefined : "bad_link" }), 
        { 
          status: ok ? 200 : 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Private: check multiple access methods
    let ok = false;
    let method = 'denied';

    // Check link token
    if (link_token && link_token === c.link_token) {
      ok = true;
      method = 'link_token';
    }

    // Check passcode
    if (!ok && passcode && c.passcode_hash) {
      const hash = await sha256(passcode);
      if (hash === c.passcode_hash) {
        ok = true;
        method = 'passcode';
      }
    }

    // Check allowlist
    if (!ok && contact) {
      const val = contact.toLowerCase();
      const { data: rule } = await supabase
        .from("campaign_access_rules")
        .select("id")
        .eq("campaign_id", campaign_id)
        .eq("rule_type", "allowlist")
        .eq("rule_value", val)
        .maybeSingle();
      
      if (rule) {
        ok = true;
        method = 'allowlist';
      }
    }

    await publishEvent("campaign.access.checked", { campaign_id, allowed: ok, method });

    console.log(`[campaign-access] Access check for ${campaign_id}: ${ok} (${method})`);

    return new Response(
      JSON.stringify({ allow: ok, reason: ok ? undefined : 'access_denied' }), 
      { 
        status: ok ? 200 : 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (e) {
    console.error('[campaign-access] Exception:', e);
    return new Response(
      JSON.stringify({ allow: false, reason: e.message }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
