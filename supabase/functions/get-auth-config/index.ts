import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthConfig {
  passwordMinLength: number;
  passwordRequireLetters: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  passwordRequireUppercase: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get GoTrue configuration from environment variables
    // Apply secure defaults if not configured
    const minLength = parseInt(Deno.env.get('GOTRUE_PASSWORD_MIN_LENGTH') || '8', 10);
    const requiredChars = Deno.env.get('GOTRUE_PASSWORD_REQUIRED_CHARACTERS') || 'letters,digits';
    
    const config: AuthConfig = {
      // Enforce minimum of 8 characters for security
      passwordMinLength: Math.max(minLength, 8),
      passwordRequireLetters: requiredChars.includes('letters') || requiredChars.includes('abcdefghijklmnopqrstuvwxyz'),
      passwordRequireNumbers: requiredChars.includes('digits') || requiredChars.includes('0123456789'),
      passwordRequireSymbols: requiredChars.includes('symbols'),
      passwordRequireUppercase: requiredChars.includes('uppercase'),
    };

    console.log('Auth config retrieved:', config);

    return new Response(
      JSON.stringify({ 
        success: true,
        data: config 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error fetching auth config:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        // Fallback defaults
        data: {
          passwordMinLength: 8,
          passwordRequireLetters: true,
          passwordRequireNumbers: true,
          passwordRequireSymbols: false,
          passwordRequireUppercase: false,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});
