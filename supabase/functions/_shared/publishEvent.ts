/**
 * Shared utility to publish events to Upstash Redis Streams
 * Used by all Edge Functions to emit domain events
 */

export async function publishEvent(event: string, payload: unknown) {
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
  
  if (!url || !token) {
    console.warn('[publishEvent] Redis not configured, skipping event publish');
    return;
  }

  const stream = Deno.env.get("EVENT_STREAM") || "fundlyhub-events";
  const body = { 
    stream, 
    event, 
    payload, 
    ts: new Date().toISOString(),
    version: '1.0.0'
  };

  try {
    const res = await fetch(`${url}/xadd/${stream}/*`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.error(`[publishEvent] Failed: ${error}`);
    } else {
      console.log(`[publishEvent] Published: ${event}`);
    }
  } catch (err) {
    console.error('[publishEvent] Exception:', err);
  }
}
