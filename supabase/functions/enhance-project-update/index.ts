import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { action, text, context } = await req.json();

    // Validate input
    if (!action || !['generate', 'improve', 'shorten', 'expand'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be: generate, improve, shorten, or expand' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!context?.fundraiserTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required context: fundraiserTitle' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt
    const systemPrompt = `You are helping create engaging project updates for a fundraising campaign. 
Your updates should be:
- Professional yet warm and personal
- Show gratitude to supporters
- Provide specific progress details when available
- Build excitement for next steps
- Use active voice and positive language
- Be concise but informative (150-300 words)`;

    // Build user prompt based on action
    let userPrompt = '';
    
    if (action === 'generate') {
      userPrompt = `Generate a compelling project update for the fundraising campaign titled "${context.fundraiserTitle}".`;
      if (context.milestoneTitle) {
        userPrompt += ` This update is related to the milestone: "${context.milestoneTitle}".`;
      }
      if (context.previousUpdates && context.previousUpdates.length > 0) {
        userPrompt += `\n\nPrevious updates for context:\n${context.previousUpdates.slice(0, 2).join('\n---\n')}`;
      }
    } else if (action === 'improve') {
      userPrompt = `Improve this project update while maintaining its core message:
- Make it more engaging and donor-focused
- Fix any grammar/spelling issues
- Ensure professional tone
- Keep it concise (under 300 words)
- Preserve important details

Original text: ${text}`;
    } else if (action === 'shorten') {
      userPrompt = `Make this project update more concise while keeping the key information:

${text}`;
    } else if (action === 'expand') {
      userPrompt = `Expand this project update with more detail and engagement:

${text}`;
    }

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedText = data.choices?.[0]?.message?.content;

    if (!enhancedText) {
      throw new Error('No enhanced text received from AI');
    }

    return new Response(
      JSON.stringify({ 
        enhancedText,
        usage: {
          model: 'google/gemini-2.5-flash',
          tokens: data.usage?.total_tokens || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in enhance-project-update:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
