import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 3 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(userId);
  
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  
  if (limit.count >= 3) {
    return false;
  }
  
  limit.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text, context } = await req.json();
    
    // Extract user ID from auth header for rate limiting
    const authHeader = req.headers.get('authorization');
    const userId = authHeader?.split('Bearer ')[1] || 'anonymous';
    
    // Check rate limit
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    if (!action || !['generate', 'refine', 'expand', 'shorten'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be: generate, refine, expand, or shorten' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context-aware prompt
    let systemPrompt = '';
    let userPrompt = '';
    let maxLength = 150;

    if (context.field === 'summary') {
      maxLength = 150;
      systemPrompt = 'You are a fundraising copywriter. Create compelling, concise summaries that capture attention and emotion. Keep summaries between 10-150 characters. Be authentic and clear.';
      
      switch (action) {
        case 'generate':
          userPrompt = `Generate a compelling fundraiser summary (10-150 characters) for a campaign titled "${context.title}" in the ${context.category} category. ${context.beneficiaryName ? `The beneficiary is ${context.beneficiaryName}.` : ''} Make it emotional and action-oriented.`;
          break;
        case 'refine':
          userPrompt = `Refine this fundraiser summary to be more compelling and clear (10-150 characters): "${text}". Campaign title: "${context.title}". Category: ${context.category}.`;
          break;
        case 'expand':
          userPrompt = `Expand this summary to be more descriptive and emotional (up to 150 characters): "${text}". Add relevant details about the ${context.category} campaign.`;
          break;
        case 'shorten':
          userPrompt = `Shorten this summary while keeping the key message (10-150 characters): "${text}". Keep the most compelling elements.`;
          break;
      }
    } else if (context.field === 'story') {
      maxLength = 1000;
      systemPrompt = 'You are a fundraising storyteller. Create compelling, detailed stories that inspire donations. Stories must be between 150-1000 characters. Use emotional language, specific details, and clear calls to action.';
      
      switch (action) {
        case 'generate':
          userPrompt = `Generate a compelling fundraiser story (150-1000 characters) for a campaign titled "${context.title}" with goal of $${context.goalAmount} in the ${context.category} category. ${context.beneficiaryName ? `The beneficiary is ${context.beneficiaryName}.` : ''} ${context.summary ? `Summary: "${context.summary}"` : ''} Include: 1) The situation/need, 2) Why it matters, 3) How funds will be used, 4) Call to action.`;
          break;
        case 'refine':
          userPrompt = `Refine this fundraiser story to be more compelling and structured (150-1000 characters): "${text}". Campaign: "${context.title}". Goal: $${context.goalAmount}. Make it more emotional and clear.`;
          break;
        case 'expand':
          userPrompt = `Expand this story with more specific details and emotional elements (up to 1000 characters): "${text}". Add context about the ${context.category} situation and impact of donations.`;
          break;
        case 'shorten':
          userPrompt = `Shorten this story while keeping key emotional elements and the call to action (150-1000 characters): "${text}". Maintain the core message.`;
          break;
      }
    } else if (context.field === 'milestone') {
      maxLength = 300;
      systemPrompt = 'You are a project management expert for fundraising campaigns. Create clear, actionable milestone descriptions that explain what will be accomplished and how funds will be used. Keep descriptions between 50-300 characters. Be specific and transparent.';
      
      switch (action) {
        case 'generate':
          userPrompt = `Generate a clear milestone description (50-300 characters) for milestone titled "${context.milestoneTitle}" with target amount of $${context.milestoneAmount} for project "${context.title}". Explain: 1) What will be accomplished, 2) How funds will be allocated, 3) Expected timeline/deliverables.`;
          break;
        case 'refine':
          userPrompt = `Refine this milestone description to be more specific and actionable (50-300 characters): "${text}". Milestone: "${context.milestoneTitle}". Amount: $${context.milestoneAmount}. Make it clearer and more transparent.`;
          break;
        case 'expand':
          userPrompt = `Expand this milestone description with more specific details about deliverables and fund usage (up to 300 characters): "${text}". Add clarity about the milestone's objectives.`;
          break;
        case 'shorten':
          userPrompt = `Shorten this milestone description while keeping key deliverables and fund allocation details (50-300 characters): "${text}". Maintain transparency.`;
          break;
      }
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
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let enhancedText = data.choices[0].message.content.trim();
    
    // Remove quotes if AI added them
    enhancedText = enhancedText.replace(/^["']|["']$/g, '');
    
    // Enforce length limits
    if (enhancedText.length > maxLength) {
      enhancedText = enhancedText.substring(0, maxLength).trim();
      // Try to end at a sentence or word boundary
      const lastPeriod = enhancedText.lastIndexOf('.');
      const lastSpace = enhancedText.lastIndexOf(' ');
      if (lastPeriod > maxLength * 0.8) {
        enhancedText = enhancedText.substring(0, lastPeriod + 1);
      } else if (lastSpace > maxLength * 0.9) {
        enhancedText = enhancedText.substring(0, lastSpace);
      }
    }

    return new Response(
      JSON.stringify({ enhancedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhance-fundraiser-text:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
