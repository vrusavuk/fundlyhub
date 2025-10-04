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
    // These are the actual Supabase Auth settings
    const config: AuthConfig = {
      passwordMinLength: parseInt(Deno.env.get('GOTRUE_PASSWORD_MIN_LENGTH') || '6', 10),
      passwordRequireLetters: Deno.env.get('GOTRUE_PASSWORD_REQUIRED_CHARACTERS')?.includes('letters') ?? false,
      passwordRequireNumbers: Deno.env.get('GOTRUE_PASSWORD_REQUIRED_CHARACTERS')?.includes('digits') ?? false,
      passwordRequireSymbols: Deno.env.get('GOTRUE_PASSWORD_REQUIRED_CHARACTERS')?.includes('symbols') ?? false,
      passwordRequireUppercase: Deno.env.get('GOTRUE_PASSWORD_REQUIRED_CHARACTERS')?.includes('uppercase') ?? false,
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
