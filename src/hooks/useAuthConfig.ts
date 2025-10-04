import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthConfig {
  passwordMinLength: number;
  passwordRequireLetters: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  passwordRequireUppercase: boolean;
}

const DEFAULT_CONFIG: AuthConfig = {
  passwordMinLength: 8,
  passwordRequireLetters: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  passwordRequireUppercase: false,
};

export const useAuthConfig = () => {
  const [config, setConfig] = useState<AuthConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-auth-config');
        
        if (error) {
          console.warn('Failed to fetch auth config, using defaults:', error);
          setConfig(DEFAULT_CONFIG);
        } else if (data?.data) {
          setConfig(data.data);
        }
      } catch (error) {
        console.warn('Error fetching auth config, using defaults:', error);
        setConfig(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthConfig();
  }, []);

  return { config, loading };
};
