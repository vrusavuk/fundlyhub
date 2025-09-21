import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'campaign' | 'user' | 'organization';
  title: string;
  subtitle?: string;
  image?: string;
  slug?: string;
  location?: string;
}

export function useSearch(query: string, enabled: boolean = true) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2 || !enabled) {
      setResults([]);
      return;
    }

    const searchDelayTimer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const searchTerm = `%${query.toLowerCase()}%`;
        
        // Search campaigns
        const { data: campaigns, error: campaignsError } = await supabase
          .from('fundraisers')
          .select(`
            id,
            title,
            summary,
            slug,
            cover_image,
            location,
            category,
            profiles!fundraisers_owner_user_id_fkey(name)
          `)
          .eq('status', 'active')
          .eq('visibility', 'public')
          .or(`title.ilike.${searchTerm},summary.ilike.${searchTerm},category.ilike.${searchTerm}`)
          .limit(10);

        // Search users/profiles
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar')
          .ilike('name', searchTerm)
          .limit(10);

        // Search organizations
        const { data: organizations, error: organizationsError } = await supabase
          .from('organizations')
          .select('id, legal_name, dba_name, website, categories')
          .or(`legal_name.ilike.${searchTerm},dba_name.ilike.${searchTerm}`)
          .limit(10);

        if (campaignsError) console.error('Campaigns search error:', campaignsError);
        if (usersError) console.error('Users search error:', usersError);
        if (organizationsError) console.error('Organizations search error:', organizationsError);

        const searchResults: SearchResult[] = [];

        // Process campaign results
        if (campaigns) {
          campaigns.forEach(campaign => {
            searchResults.push({
              id: campaign.id,
              type: 'campaign',
              title: campaign.title,
              subtitle: `${campaign.category} • by ${campaign.profiles?.name || 'Anonymous'}`,
              image: campaign.cover_image,
              slug: campaign.slug,
              location: campaign.location
            });
          });
        }

        // Process user results
        if (users) {
          users.forEach(user => {
            searchResults.push({
              id: user.id,
              type: 'user',
              title: user.name || 'Anonymous User',
              subtitle: user.email,
              image: user.avatar
            });
          });
        }

        // Process organization results
        if (organizations) {
          organizations.forEach(org => {
            searchResults.push({
              id: org.id,
              type: 'organization',
              title: org.dba_name || org.legal_name,
              subtitle: org.website || 'Organization',
              image: undefined
            });
          });
        }

        setResults(searchResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(searchDelayTimer);
  }, [query, enabled]);

  return { results, loading, error };
}