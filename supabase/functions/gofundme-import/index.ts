import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoFundMeData {
  title: string;
  story: string;
  summary: string;
  goalAmount: number;
  currency: string;
  coverImage: string | null;
  beneficiaryName: string | null;
  location: string | null;
  categoryName: string | null;
  amountRaised: number | null;
  donorCount: number | null;
}

// Category mapping from GoFundMe categories to FundlyHub categories
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Medical': ['medical', 'hospital', 'surgery', 'treatment', 'cancer', 'health', 'illness', 'disease', 'therapy', 'doctor', 'medication', 'healing', 'recovery', 'diagnosis'],
  'Emergency': ['emergency', 'urgent', 'fire', 'disaster', 'accident', 'crisis', 'flood', 'hurricane', 'earthquake'],
  'Memorial': ['memorial', 'funeral', 'remembrance', 'passed away', 'tribute', 'in memory', 'loss', 'burial'],
  'Education': ['education', 'school', 'tuition', 'scholarship', 'college', 'university', 'student', 'learning'],
  'Family': ['family', 'children', 'kids', 'baby', 'parent', 'adoption', 'custody'],
  'Sports': ['sports', 'team', 'athlete', 'competition', 'tournament', 'league', 'championship'],
  'Animals': ['animal', 'pet', 'dog', 'cat', 'rescue', 'shelter', 'veterinary', 'vet'],
  'Environment': ['environment', 'climate', 'conservation', 'wildlife', 'nature', 'sustainable', 'green'],
  'Community': ['community', 'neighborhood', 'local', 'civic', 'public', 'town', 'city'],
  'Creative': ['creative', 'art', 'music', 'film', 'book', 'album', 'project', 'production'],
  'Business': ['business', 'startup', 'entrepreneur', 'company', 'venture', 'small business'],
  'Faith': ['faith', 'church', 'religious', 'spiritual', 'mission', 'congregation'],
  'Travel': ['travel', 'trip', 'journey', 'adventure', 'volunteer abroad'],
  'Events': ['event', 'wedding', 'birthday', 'celebration', 'party', 'reunion'],
  'Nonprofit': ['nonprofit', 'charity', 'organization', 'foundation', 'cause'],
  'Other': [],
};

function detectCategory(content: string, title: string): string | null {
  const searchText = `${title} ${content}`.toLowerCase();
  
  let bestMatch: { category: string; count: number } | null = null;
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'Other') continue;
    
    let matchCount = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        matchCount++;
      }
    }
    
    if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.count)) {
      bestMatch = { category, count: matchCount };
    }
  }
  
  return bestMatch?.category || null;
}

function generateSummary(story: string, title: string): string {
  // Try to extract first meaningful sentence
  const sentences = story.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length > 0) {
    let summary = sentences[0].trim();
    // Ensure it's not too long
    if (summary.length > 150) {
      summary = summary.substring(0, 147) + '...';
    } else if (summary.length < 10) {
      // Too short, try combining first two sentences
      summary = sentences.slice(0, 2).join('. ').trim();
      if (summary.length > 150) {
        summary = summary.substring(0, 147) + '...';
      }
    }
    return summary;
  }
  
  // Fallback to using title
  return `Help support ${title}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate GoFundMe URL
    const gofundmePattern = /^https?:\/\/(www\.)?gofundme\.com\/f\/[\w-]+/i;
    if (!gofundmePattern.test(url)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid GoFundMe URL. Please provide a valid campaign link.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Import service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping GoFundMe URL:', url);

    // Use Firecrawl to scrape the page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl API error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch campaign data. The page may be unavailable.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const html = scrapeData.data?.html || scrapeData.html || '';
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    console.log('Scrape successful, parsing content...');

    // Extract data from the scraped content
    const extractedData = parseGoFundMeContent(markdown, html, metadata);

    if (!extractedData.title) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract campaign information. The page structure may have changed.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully extracted campaign data:', extractedData.title);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        sourceUrl: url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error importing from GoFundMe:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to import campaign. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseGoFundMeContent(markdown: string, html: string, metadata: any): GoFundMeData {
  const data: GoFundMeData = {
    title: '',
    story: '',
    summary: '',
    goalAmount: 0,
    currency: 'USD',
    coverImage: null,
    beneficiaryName: null,
    location: null,
    categoryName: null,
    amountRaised: null,
    donorCount: null,
  };

  // Extract title from metadata or content
  let rawTitle = metadata.title?.replace(/\s*-\s*GoFundMe.*$/i, '').trim() || '';
  
  // Remove "Fundraiser by X : " prefix pattern
  rawTitle = rawTitle.replace(/^Fundraiser\s+by\s+[^:]+\s*:\s*/i, '').trim();
  
  data.title = rawTitle;
  
  if (!data.title) {
    // Try to find title in markdown (usually first h1)
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      data.title = titleMatch[1].replace(/^Fundraiser\s+by\s+[^:]+\s*:\s*/i, '').trim();
    }
  }

  // Extract cover image from metadata
  if (metadata.ogImage) {
    data.coverImage = metadata.ogImage;
  }

  // Extract goal amount - look for patterns with K/M suffixes
  const goalPatterns = [
    // Patterns with K suffix: "$200K", "of$200K", "of $200K"
    { pattern: /of\s*\$?\s*([0-9,]+(?:\.[0-9]+)?)\s*K\b/i, multiplier: 1000 },
    { pattern: /\$([0-9,]+(?:\.[0-9]+)?)\s*K\s*goal/i, multiplier: 1000 },
    // Patterns with M suffix
    { pattern: /of\s*\$?\s*([0-9,]+(?:\.[0-9]+)?)\s*M\b/i, multiplier: 1000000 },
    { pattern: /\$([0-9,]+(?:\.[0-9]+)?)\s*M\s*goal/i, multiplier: 1000000 },
    // Standard patterns without suffix
    { pattern: /\$([0-9,]+(?:\.[0-9]+)?)\s*goal/i, multiplier: 1 },
    { pattern: /goal\s*(?:of\s*)?\$([0-9,]+(?:\.[0-9]+)?)/i, multiplier: 1 },
    { pattern: /of\s*\$([0-9,]+(?:\.[0-9]+)?)\b/i, multiplier: 1 },
    // Euro/Pound patterns
    { pattern: /€([0-9,]+(?:\.[0-9]+)?)\s*goal/i, multiplier: 1 },
    { pattern: /£([0-9,]+(?:\.[0-9]+)?)\s*goal/i, multiplier: 1 },
  ];
  
  for (const { pattern, multiplier } of goalPatterns) {
    const match = markdown.match(pattern) || html.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr) * multiplier;
      
      if (amount > 0) {
        data.goalAmount = amount;
        
        // Detect currency
        if (markdown.includes('€') || html.includes('€')) {
          data.currency = 'EUR';
        } else if (markdown.includes('£') || html.includes('£')) {
          data.currency = 'GBP';
        }
        break;
      }
    }
  }

  // Extract amount raised
  const raisedPatterns = [
    /\$([0-9,]+(?:\.[0-9]+)?)\s*(?:raised|of)/i,
    /raised\s*\$([0-9,]+(?:\.[0-9]+)?)/i,
  ];
  
  for (const pattern of raisedPatterns) {
    const match = markdown.match(pattern) || html.match(pattern);
    if (match) {
      data.amountRaised = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Extract donor count
  const donorMatch = markdown.match(/([0-9,]+)\s*(?:donors?|donations?)/i) || 
                     html.match(/([0-9,]+)\s*(?:donors?|donations?)/i);
  if (donorMatch) {
    data.donorCount = parseInt(donorMatch[1].replace(/,/g, ''), 10);
  }

  // Extract location - improved patterns
  const locationPatterns = [
    /📍\s*([^,\n]+(?:,\s*[A-Z]{2})?)/i,
    /(?:Located in|from|Location:)\s*([^,\n]+(?:,\s*[A-Z]{2})?)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\s*(?:\||$)/m, // City, ST pattern
  ];
  
  for (const pattern of locationPatterns) {
    const match = markdown.match(pattern) || html.match(pattern);
    if (match) {
      const loc = match[1].trim();
      // Filter out non-location matches
      if (loc.length > 2 && loc.length < 100 && !loc.includes('http')) {
        data.location = loc;
        break;
      }
    }
  }

  // Extract beneficiary name if different from organizer
  const beneficiaryPatterns = [
    /(?:for|helping|support(?:ing)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:'s)?/i,
    /Beneficiary[:\s]+([^\n]+)/i,
  ];
  
  for (const pattern of beneficiaryPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const name = match[1].replace(/'s$/, '').trim();
      if (name.length > 2 && name.length < 100) {
        data.beneficiaryName = name;
        break;
      }
    }
  }

  // Extract story - main content after removing headers and metadata
  let story = markdown;
  
  // Remove the title if present at the start
  story = story.replace(/^#\s+.+\n+/, '');
  
  // Remove common GoFundMe navigation/footer elements
  story = story.replace(/\*\*Share\*\*[\s\S]*$/i, '');
  story = story.replace(/\*\*Donate now\*\*[\s\S]*$/i, '');
  story = story.replace(/\[.*?\]\(.*?\)/g, ''); // Remove markdown links
  story = story.replace(/!\[.*?\]\(.*?\)/g, ''); // Remove images
  
  // Remove donation/goal stats at the start
  story = story.replace(/^\$[0-9,]+.*?goal\s*/im, '');
  story = story.replace(/^[0-9,]+\s*donors?\s*/im, '');
  
  // Remove navigation items
  story = story.replace(/^(?:Donate|Share|Updates?|Comments?|Organizer?)\s*$/gim, '');
  
  // Clean up whitespace
  story = story.replace(/\n{3,}/g, '\n\n').trim();
  
  data.story = story;

  // Generate summary from story
  data.summary = generateSummary(story, data.title);

  // Detect category
  data.categoryName = detectCategory(story, data.title);

  return data;
}
