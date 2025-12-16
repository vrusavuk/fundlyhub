import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoFundMeData {
  title: string;
  story: string;
  goalAmount: number;
  currency: string;
  coverImage: string | null;
  beneficiaryName: string | null;
  location: string | null;
  organizerName: string | null;
  amountRaised: number | null;
  donorCount: number | null;
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
    goalAmount: 0,
    currency: 'USD',
    coverImage: null,
    beneficiaryName: null,
    location: null,
    organizerName: null,
    amountRaised: null,
    donorCount: null,
  };

  // Extract title from metadata or content
  data.title = metadata.title?.replace(/\s*-\s*GoFundMe.*$/i, '').trim() || '';
  
  if (!data.title) {
    // Try to find title in markdown (usually first h1)
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }
  }

  // Extract cover image from metadata
  if (metadata.ogImage) {
    data.coverImage = metadata.ogImage;
  }

  // Extract goal amount - look for patterns like "$10,000 goal" or "goal of $10,000"
  const goalPatterns = [
    /\$([0-9,]+(?:\.[0-9]{2})?)\s*goal/i,
    /goal\s*(?:of\s*)?\$([0-9,]+(?:\.[0-9]{2})?)/i,
    /€([0-9,]+(?:\.[0-9]{2})?)\s*goal/i,
    /£([0-9,]+(?:\.[0-9]{2})?)\s*goal/i,
  ];
  
  for (const pattern of goalPatterns) {
    const match = markdown.match(pattern) || html.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      data.goalAmount = parseFloat(amountStr);
      
      // Detect currency
      if (markdown.includes('€') || html.includes('€')) {
        data.currency = 'EUR';
      } else if (markdown.includes('£') || html.includes('£')) {
        data.currency = 'GBP';
      }
      break;
    }
  }

  // Extract amount raised
  const raisedPatterns = [
    /\$([0-9,]+(?:\.[0-9]{2})?)\s*(?:raised|of)/i,
    /raised\s*\$([0-9,]+(?:\.[0-9]{2})?)/i,
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

  // Extract location
  const locationMatch = markdown.match(/(?:📍|Located in|from)\s*([^,\n]+(?:,\s*[A-Z]{2})?)/i);
  if (locationMatch) {
    data.location = locationMatch[1].trim();
  }

  // Extract organizer name - look for "Organizer" or "organized by" patterns
  const organizerPatterns = [
    /(?:Organizer|Organized by)[:\s]+([^\n|]+)/i,
    /(?:by|created by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  ];
  
  for (const pattern of organizerPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      data.organizerName = match[1].trim();
      break;
    }
  }

  // Extract beneficiary name if different from organizer
  const beneficiaryPatterns = [
    /(?:for|helping|support)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:'s)?)/i,
    /Beneficiary[:\s]+([^\n]+)/i,
  ];
  
  for (const pattern of beneficiaryPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const name = match[1].replace(/'s$/, '').trim();
      if (name !== data.organizerName) {
        data.beneficiaryName = name;
      }
      break;
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
  
  // Clean up whitespace
  story = story.replace(/\n{3,}/g, '\n\n').trim();
  
  // Take the main story content (limit to reasonable length)
  if (story.length > 5000) {
    story = story.substring(0, 5000) + '...';
  }
  
  data.story = story;

  return data;
}
