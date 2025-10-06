import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { publishEvent } from "../_shared/publishEvent.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { 
      name, 
      type = "personal", 
      visibility = "private", 
      goal_amount, 
      currency = "USD", 
      access 
    } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate link token
    const linkToken = crypto.randomUUID().replace(/-/g, '').slice(0, 22);

    // Hash passcode if provided
    let passcode_hash: string | null = null;
    if (access?.passcode) {
      const encoder = new TextEncoder();
      const raw = encoder.encode(access.passcode);
      const digest = await crypto.subtle.digest("SHA-256", raw);
      passcode_hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    // Create campaign with service role
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: campaign, error } = await adminSupabase
      .from("fundraisers")
      .insert({
        title: name,
        slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        type,
        visibility,
        goal_amount,
        currency,
        link_token: linkToken,
        passcode_hash,
        is_discoverable: visibility === "public",
        owner_user_id: user.id,
        status: 'draft'
      })
      .select("*")
      .single();

    if (error) {
      console.error('[campaign-create] Error:', error);
      throw error;
    }

    // Insert access rules if allowlist provided
    if (access?.allowlist_emails?.length) {
      const toInsert = access.allowlist_emails.map((email: string) => ({
        campaign_id: campaign.id,
        rule_type: "allowlist",
        rule_value: email.toLowerCase(),
        created_by: user.id
      }));
      
      await adminSupabase.from("campaign_access_rules").insert(toInsert);
    }

    // Publish event
    await publishEvent("campaign.created", {
      id: campaign.id,
      visibility,
      type,
      link_token_last4: linkToken.slice(-4),
      owner_id: user.id
    });

    console.log(`[campaign-create] Campaign created: ${campaign.id}`);

    return new Response(
      JSON.stringify({ 
        campaign_id: campaign.id, 
        link_token: linkToken 
      }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (e) {
    console.error('[campaign-create] Exception:', e);
    return new Response(
      JSON.stringify({ error: e.message }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
