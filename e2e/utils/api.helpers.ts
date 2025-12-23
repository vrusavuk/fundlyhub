import { Page, APIRequestContext } from '@playwright/test';

/**
 * API Helper Functions for E2E Tests
 * For setting up test data or verifying backend state
 */

const SUPABASE_URL = 'https://sgcaqrtnxqhrrqzxmupa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY2FxcnRueHFocnJxenhtdXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTgwNjIsImV4cCI6MjA3Mzk5NDA2Mn0.hkoB8lsrDX4bAl2pUAZVj6tNQIhif_LLm6VTtLcEAY4';

/**
 * Get the Supabase API headers
 */
function getSupabaseHeaders(accessToken?: string) {
  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
}

/**
 * Fetch public campaigns via API
 */
export async function fetchPublicCampaigns(
  request: APIRequestContext,
  options?: { limit?: number; status?: string }
) {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.status) params.set('status', `eq.${options.status}`);
  params.set('visibility', 'eq.public');
  params.set('deleted_at', 'is.null');
  
  const response = await request.get(
    `${SUPABASE_URL}/rest/v1/fundraisers?${params}`,
    { headers: getSupabaseHeaders() }
  );
  
  return response.json();
}

/**
 * Fetch a specific campaign by slug
 */
export async function fetchCampaignBySlug(
  request: APIRequestContext,
  slug: string
) {
  const response = await request.get(
    `${SUPABASE_URL}/rest/v1/fundraisers?slug=eq.${slug}&select=*`,
    { headers: getSupabaseHeaders() }
  );
  
  const data = await response.json();
  return data[0] || null;
}

/**
 * Fetch donations for a campaign
 */
export async function fetchCampaignDonations(
  request: APIRequestContext,
  campaignId: string
) {
  const response = await request.get(
    `${SUPABASE_URL}/rest/v1/donations?fundraiser_id=eq.${campaignId}&payment_status=eq.paid&select=*`,
    { headers: getSupabaseHeaders() }
  );
  
  return response.json();
}

/**
 * Verify a donation exists
 */
export async function verifyDonationExists(
  request: APIRequestContext,
  options: { campaignId: string; amount?: number; email?: string }
) {
  let query = `fundraiser_id=eq.${options.campaignId}`;
  if (options.amount) query += `&amount=eq.${options.amount}`;
  if (options.email) query += `&donor_email=eq.${options.email}`;
  
  const response = await request.get(
    `${SUPABASE_URL}/rest/v1/donations?${query}&select=id`,
    { headers: getSupabaseHeaders() }
  );
  
  const data = await response.json();
  return data.length > 0;
}

/**
 * Get session from page context
 */
export async function getSessionFromPage(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const storage = localStorage.getItem('sb-sgcaqrtnxqhrrqzxmupa-auth-token');
    if (storage) {
      try {
        const parsed = JSON.parse(storage);
        return parsed.access_token || null;
      } catch {
        return null;
      }
    }
    return null;
  });
}

/**
 * Wait for API response with specific status
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options?: { status?: number; timeout?: number }
) {
  return page.waitForResponse(
    (response) => {
      const urlMatches = typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url());
      
      const statusMatches = options?.status
        ? response.status() === options.status
        : true;
      
      return urlMatches && statusMatches;
    },
    { timeout: options?.timeout || 10000 }
  );
}

/**
 * Intercept and mock API response
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: { status?: number; body?: unknown }
) {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status: response.status || 200,
      contentType: 'application/json',
      body: JSON.stringify(response.body || {}),
    });
  });
}

/**
 * Clear all API mocks
 */
export async function clearApiMocks(page: Page) {
  await page.unrouteAll();
}

/**
 * Get categories from API
 */
export async function fetchCategories(request: APIRequestContext) {
  const response = await request.get(
    `${SUPABASE_URL}/rest/v1/categories?is_active=eq.true&select=*&order=display_order`,
    { headers: getSupabaseHeaders() }
  );
  
  return response.json();
}

/**
 * Check API health
 */
export async function checkApiHealth(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(`${SUPABASE_URL}/rest/v1/`, {
      headers: getSupabaseHeaders(),
    });
    return response.ok();
  } catch {
    return false;
  }
}
