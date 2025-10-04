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
  link: string;
  snippet?: string;
  relevanceScore?: number;
  matchedFields?: string[];
  highlightedTitle?: string;
  highlightedSubtitle?: string;
  matchedSnippet?: string;
  matchedIn?: string;
}

// Smart search utilities
const calculateRelevanceScore = (searchTerms: string[], text: string, isTitle: boolean = false): number => {
  if (!text) return 0;
  
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/);
  let score = 0;
  
  searchTerms.forEach(term => {
    const termLower = term.toLowerCase();
    
    // Exact match bonus
    if (textLower.includes(termLower)) {
      score += isTitle ? 10 : 5;
    }
    
    // Word boundary match bonus
    if (new RegExp(`\\b${termLower}`, 'i').test(textLower)) {
      score += isTitle ? 8 : 4;
    }
    
    // Partial word match
    words.forEach(word => {
      if (word.includes(termLower)) {
        score += isTitle ? 3 : 1.5;
      }
      
      // Fuzzy match (allowing for typos)
      if (calculateLevenshteinDistance(termLower, word) <= Math.max(1, Math.floor(termLower.length * 0.2))) {
        score += isTitle ? 2 : 1;
      }
    });
  });
  
  return score;
};

const calculateLevenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

const normalizeQuery = (query: string): string[] => {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0);
};

const highlightText = (text: string, searchTerms: string[]): string => {
  if (!text || searchTerms.length === 0) return text;
  
  let highlighted = text;
  
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });
  
  return highlighted;
};

const extractSnippet = (text: string, searchTerms: string[], maxLength: number = 150): string => {
  if (!text || searchTerms.length === 0) return '';
  
  const textLower = text.toLowerCase();
  let bestStart = 0;
  let bestScore = 0;
  
  // Find the best position that contains the most search terms
  searchTerms.forEach(term => {
    const termLower = term.toLowerCase();
    const index = textLower.indexOf(termLower);
    if (index !== -1) {
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + term.length + 50);
      const snippet = text.slice(start, end);
      const score = searchTerms.reduce((acc, t) => {
        return acc + (snippet.toLowerCase().includes(t.toLowerCase()) ? 1 : 0);
      }, 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestStart = start;
      }
    }
  });
  
  const snippet = text.slice(bestStart, bestStart + maxLength);
  return snippet.length < text.length ? `...${snippet}...` : snippet;
};

const checkFieldMatches = (searchTerms: string[], fields: Record<string, string | null | undefined>): {
  matchedFields: string[];
  scores: Record<string, number>;
} => {
  const matchedFields: string[] = [];
  const scores: Record<string, number> = {};
  
  Object.entries(fields).forEach(([fieldName, fieldValue]) => {
    if (fieldValue) {
      const score = calculateRelevanceScore(searchTerms, fieldValue, fieldName === 'title');
      if (score > 0) {
        matchedFields.push(fieldName);
        scores[fieldName] = score;
      }
    }
  });
  
  return { matchedFields, scores };
};

interface UseSearchOptions {
  query: string;
  enabled?: boolean;
}

export function useSearch(options: UseSearchOptions) {
  const { query, enabled = true } = options;
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const BATCH_SIZE = 20;

  // Reset results when query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2 || !enabled) {
      setResults([]);
      setHasMore(false);
      setOffset(0);
      return;
    }

    // Reset for new query
    setOffset(0);
    performSearch(query, 0, true);
  }, [query, enabled]);

  const performSearch = async (searchQuery: string, currentOffset: number, isNewSearch: boolean = false) => {
    if (isNewSearch) {
      setLoading(true);
    }
    setError(null);

    try {
      const searchTerms = normalizeQuery(searchQuery);
      
      // Fetch campaigns with pagination
      const { data: campaigns, error: campaignsError } = await supabase
        .from('fundraisers')
        .select(`
          id,
          title,
          summary,
          slug,
          cover_image,
          location,
          story_html,
          profiles!fundraisers_owner_user_id_fkey(name)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .range(currentOffset, currentOffset + BATCH_SIZE - 1);

      // Fetch users with pagination
      // Use public_profiles view to avoid exposing email addresses in search
      const { data: users, error: usersError } = await supabase
        .from('public_profiles')
        .select('id, name, avatar')
        .range(currentOffset, currentOffset + BATCH_SIZE - 1);

      // Fetch organizations with pagination
      const { data: organizations, error: organizationsError } = await supabase
        .from('organizations')
        .select(`
          id,
          legal_name,
          dba_name,
          website,
          categories,
          country,
          verification_status
        `)
        .range(currentOffset, currentOffset + BATCH_SIZE - 1);

      if (campaignsError) throw campaignsError;
      if (usersError) throw usersError;
      if (organizationsError) throw organizationsError;

      const newResults: SearchResult[] = [];

      // Process campaigns
      if (campaigns) {
        campaigns.forEach(campaign => {
          // Extract text content from HTML story
          const storyText = campaign.story_html ? 
            campaign.story_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
          
          const fields = {
            title: campaign.title,
            summary: campaign.summary,
            story: storyText,
            location: campaign.location,
            creator: campaign.profiles?.name
          };
          
          const { matchedFields, scores } = checkFieldMatches(searchTerms, fields);
          
          if (matchedFields.length > 0) {
            const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
            
            // Determine what was matched for better UX
            let matchedIn = 'title';
            if (scores.summary > (scores.title || 0)) matchedIn = 'description';
            if (scores.story > (scores.summary || 0)) matchedIn = 'full description';
            
            const highlightedTitle = highlightText(campaign.title, searchTerms);
            const subtitle = `by ${campaign.profiles?.name || 'Anonymous'}`;
            const highlightedSubtitle = highlightText(subtitle, searchTerms);
            
            let matchedSnippet = '';
            if (matchedIn === 'description') {
              matchedSnippet = extractSnippet(campaign.summary || '', searchTerms);
            } else if (matchedIn === 'full description') {
              matchedSnippet = extractSnippet(storyText, searchTerms);
            }
            
            newResults.push({
              id: campaign.id,
              type: 'campaign',
              title: campaign.title,
              subtitle,
              image: campaign.cover_image,
              slug: campaign.slug,
              location: campaign.location,
              link: `/fundraiser/${campaign.slug}`,
              snippet: matchedSnippet,
              relevanceScore: totalScore,
              matchedFields,
              highlightedTitle,
              highlightedSubtitle,
              matchedSnippet,
              matchedIn
            });
          }
        });
      }

      // Process users
      if (users) {
        users.forEach(user => {
          const nameScore = calculateRelevanceScore(searchTerms, user.name || '', true);
          
          const totalScore = nameScore;
          
          if (totalScore > 0.5) {
            newResults.push({
              id: user.id,
              type: 'user',
              title: user.name || 'Anonymous User',
              subtitle: 'User Profile', // Don't expose email in search results
              image: user.avatar,
              link: `/profile/${user.id}`,
              relevanceScore: totalScore,
              highlightedTitle: highlightText(user.name || 'Anonymous User', searchTerms),
              highlightedSubtitle: 'User Profile',
              matchedIn: 'name'
            });
          }
        });
      }

      // Process organizations
      if (organizations) {
        organizations.forEach(org => {
          const fields = {
            legal_name: org.legal_name,
            dba_name: org.dba_name,
            website: org.website,
            categories: org.categories?.join(' '),
            country: org.country
          };
          
          const { matchedFields, scores } = checkFieldMatches(searchTerms, fields);
          
          if (matchedFields.length > 0) {
            const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
            
            // Determine what was matched for better UX
            let matchedIn = 'name';
            if (scores.dba_name > (scores.legal_name || 0)) matchedIn = 'dba_name';
            if (scores.categories > Math.max(scores.legal_name || 0, scores.dba_name || 0)) matchedIn = 'categories';
            
            const displayName = org.dba_name || org.legal_name;
            const highlightedTitle = highlightText(displayName, searchTerms);
            
            let subtitle = '';
            if (org.dba_name && org.legal_name !== org.dba_name) {
              subtitle = `Legal: ${org.legal_name}`;
            }
            if (org.country) {
              subtitle = subtitle ? `${subtitle} • ${org.country}` : org.country;
            }
            if (org.categories && org.categories.length > 0) {
              const categoryText = org.categories.slice(0, 2).join(', ');
              subtitle = subtitle ? `${subtitle} • ${categoryText}` : categoryText;
            }
            
            const highlightedSubtitle = highlightText(subtitle, searchTerms);
            
            let matchedSnippet = '';
            if (matchedIn === 'categories' && org.categories) {
              const categoriesText = org.categories.join(', ');
              matchedSnippet = extractSnippet(`Categories: ${categoriesText}`, searchTerms);
            } else if (matchedIn === 'dba_name' && org.dba_name) {
              matchedSnippet = highlightText(`Also known as: ${org.dba_name}`, searchTerms);
            } else if (matchedIn === 'legal_name') {
              matchedSnippet = highlightText(`Legal name: ${org.legal_name}`, searchTerms);
            } else if (matchedIn === 'website' && org.website) {
              matchedSnippet = highlightText(`Website: ${org.website}`, searchTerms);
            }
            
            newResults.push({
              id: org.id,
              type: 'organization',
              title: displayName,
              subtitle,
              image: undefined,
              link: `/organization/${org.id}`,
              snippet: matchedSnippet,
              relevanceScore: totalScore,
              matchedFields,
              highlightedTitle,
              highlightedSubtitle,
              matchedSnippet: highlightText(matchedSnippet, searchTerms),
              matchedIn
            });
          }
        });
      }

      // Sort by relevance score
      newResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      if (isNewSearch) {
        setResults(newResults);
      } else {
        setResults(prev => [...prev, ...newResults]);
      }

      // Update pagination state
      setOffset(currentOffset + BATCH_SIZE);
      setHasMore(newResults.length === BATCH_SIZE);

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore && query.trim().length >= 2) {
      performSearch(query, offset, false);
    }
  };

  return {
    results,
    loading,
    error,
    hasMore,
    loadMore
  };
}