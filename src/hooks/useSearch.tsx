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

const calculateLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
};

const normalizeQuery = (query: string): string[] => {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 1);
};

// Text highlighting utilities
const highlightText = (text: string, searchTerms: string[]): string => {
  if (!text || !searchTerms.length) return text;
  
  let highlightedText = text;
  
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  });
  
  return highlightedText;
};

const extractSnippet = (text: string, searchTerms: string[], maxLength: number = 150): string => {
  if (!text || !searchTerms.length) return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  
  const textLower = text.toLowerCase();
  let bestMatch = { index: -1, term: '' };
  
  // Find the earliest match
  searchTerms.forEach(term => {
    const index = textLower.indexOf(term.toLowerCase());
    if (index !== -1 && (bestMatch.index === -1 || index < bestMatch.index)) {
      bestMatch = { index, term };
    }
  });
  
  if (bestMatch.index === -1) return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  
  // Extract snippet around the match
  const start = Math.max(0, bestMatch.index - 50);
  const end = Math.min(text.length, start + maxLength);
  let snippet = text.slice(start, end);
  
  // Add ellipsis if needed
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
};

const checkFieldMatches = (searchTerms: string[], fields: Record<string, string>): { matchedFields: string[], matchedIn: string } => {
  const matches: string[] = [];
  
  Object.entries(fields).forEach(([fieldName, fieldValue]) => {
    if (fieldValue && searchTerms.some(term => fieldValue.toLowerCase().includes(term.toLowerCase()))) {
      matches.push(fieldName);
    }
  });
  
  // Determine primary match location for display
  let matchedIn = '';
  if (matches.includes('title') || matches.includes('dba_name') || matches.includes('legal_name')) matchedIn = 'title';
  else if (matches.includes('summary')) matchedIn = 'description';
  else if (matches.includes('story')) matchedIn = 'full description';
  else if (matches.includes('category') || matches.includes('categories')) matchedIn = 'categories';
  else if (matches.includes('location')) matchedIn = 'location';
  else if (matches.includes('owner')) matchedIn = 'creator';
  else if (matches.includes('website')) matchedIn = 'website';
  
  return { matchedFields: matches, matchedIn };
};

export function useSearch(query: string, enabled: boolean = true) {
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
          category,
          story_html,
          profiles!fundraisers_owner_user_id_fkey(name)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .range(currentOffset, currentOffset + BATCH_SIZE - 1);

      // Fetch users with pagination
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar')
        .range(Math.floor(currentOffset / 3), Math.floor(currentOffset / 3) + Math.floor(BATCH_SIZE / 3) - 1);

      // Fetch organizations with pagination  
      const { data: organizations, error: organizationsError } = await supabase
        .from('organizations')
        .select('id, legal_name, dba_name, website, categories, country, address')
        .range(Math.floor(currentOffset / 3), Math.floor(currentOffset / 3) + Math.floor(BATCH_SIZE / 3) - 1);

      if (campaignsError) console.error('Campaigns search error:', campaignsError);
      if (usersError) console.error('Users search error:', usersError);
      if (organizationsError) console.error('Organizations search error:', organizationsError);

      const newResults: SearchResult[] = [];

      // Smart campaign filtering with relevance scoring
      if (campaigns) {
        campaigns.forEach(campaign => {
          const titleScore = calculateRelevanceScore(searchTerms, campaign.title, true);
          const summaryScore = calculateRelevanceScore(searchTerms, campaign.summary);
          const categoryScore = calculateRelevanceScore(searchTerms, campaign.category);
          const locationScore = calculateRelevanceScore(searchTerms, campaign.location || '');
          const ownerScore = calculateRelevanceScore(searchTerms, campaign.profiles?.name || '');
          
          // Extract text from HTML story
          const storyText = campaign.story_html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ') || '';
          const storyScore = calculateRelevanceScore(searchTerms, storyText) * 0.3;
          
          const totalScore = titleScore + summaryScore + categoryScore + locationScore + ownerScore + storyScore;
          
          if (totalScore > 0.5) {
            const { matchedFields, matchedIn } = checkFieldMatches(searchTerms, {
              title: campaign.title,
              summary: campaign.summary,
              story: storyText,
              category: campaign.category,
              location: campaign.location || '',
              owner: campaign.profiles?.name || ''
            });
            
            const highlightedTitle = highlightText(campaign.title, searchTerms);
            const subtitle = `${campaign.category} • by ${campaign.profiles?.name || 'Anonymous'}`;
            const highlightedSubtitle = highlightText(subtitle, searchTerms);
            
            let matchedSnippet = '';
            if (matchedIn === 'description') {
              matchedSnippet = extractSnippet(campaign.summary, searchTerms);
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

      // Smart user filtering
      if (users) {
        users.forEach(user => {
          const nameScore = calculateRelevanceScore(searchTerms, user.name || '', true);
          const emailScore = calculateRelevanceScore(searchTerms, user.email || '');
          
          const totalScore = nameScore + emailScore;
          
          if (totalScore > 0.5) {
            newResults.push({
              id: user.id,
              type: 'user',
              title: user.name || 'Anonymous User',
              subtitle: user.email,
              image: user.avatar,
              relevanceScore: totalScore,
              highlightedTitle: highlightText(user.name || 'Anonymous User', searchTerms),
              highlightedSubtitle: highlightText(user.email || '', searchTerms),
              matchedIn: 'name'
            });
          }
        });
      }

      // Smart organization filtering
      if (organizations) {
        organizations.forEach(org => {
          const legalNameScore = calculateRelevanceScore(searchTerms, org.legal_name || '', true);
          const dbaNameScore = calculateRelevanceScore(searchTerms, org.dba_name || '', true);
          const websiteScore = calculateRelevanceScore(searchTerms, org.website || '');
          const categoriesText = Array.isArray(org.categories) ? org.categories.join(' ') : '';
          const categoriesScore = calculateRelevanceScore(searchTerms, categoriesText);
          
          const totalScore = legalNameScore + dbaNameScore + websiteScore + categoriesScore;
          
          if (totalScore > 0.5) {
            const { matchedFields, matchedIn } = checkFieldMatches(searchTerms, {
              legal_name: org.legal_name || '',
              dba_name: org.dba_name || '',
              website: org.website || '',
              categories: categoriesText
            });
            
            const orgTitle = org.dba_name || org.legal_name;
            const orgSubtitle = categoriesText || org.website || 'Organization';
            const highlightedTitle = highlightText(orgTitle, searchTerms);
            const highlightedSubtitle = highlightText(orgSubtitle, searchTerms);
            
            let matchedSnippet = '';
            if (matchedIn === 'categories' && categoriesText) {
              matchedSnippet = extractSnippet(categoriesText, searchTerms);
            } else if (matchedIn === 'website' && org.website) {
              matchedSnippet = extractSnippet(org.website, searchTerms);
            }
            
            newResults.push({
              id: org.id,
              type: 'organization',
              title: orgTitle,
              subtitle: orgSubtitle,
              image: undefined,
              relevanceScore: totalScore,
              matchedFields,
              highlightedTitle,
              highlightedSubtitle,
              matchedSnippet: highlightText(matchedSnippet, searchTerms),
              matchedIn: matchedIn || 'organization'
            });
          }
        });
      }

      // Sort by relevance score
      const sortedResults = newResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      if (isNewSearch) {
        setResults(sortedResults);
      } else {
        setResults(prev => [...prev, ...sortedResults]);
      }

      // Check if there are more results
      const totalFetched = (campaigns?.length || 0) + (users?.length || 0) + (organizations?.length || 0);
      setHasMore(totalFetched === BATCH_SIZE);
      setOffset(currentOffset + BATCH_SIZE);

    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      if (isNewSearch) {
        setLoading(false);
      }
    }
  };

  const loadMore = () => {
    if (!loading && hasMore && query.trim() && query.length >= 2) {
      performSearch(query, offset, false);
    }
  };

  return { results, loading, error, hasMore, loadMore };
}