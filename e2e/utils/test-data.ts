/**
 * Test Data Factories and Constants for E2E Tests
 */

// Test user credentials - these should match real test accounts in the database
// For security, use environment variables in CI
export const TEST_USERS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!',
  },
  user: {
    email: process.env.TEST_USER_EMAIL || 'user@test.com',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  },
  creator: {
    email: process.env.TEST_CREATOR_EMAIL || 'creator@test.com',
    password: process.env.TEST_CREATOR_PASSWORD || 'TestPassword123!',
  },
};

// Known campaign slugs with real Stripe payments (from database analysis)
export const REAL_CAMPAIGNS = {
  title: {
    id: '43c2c3bd-338f-4597-960b-b691f0ebf466',
    slug: 'title', // May need to verify actual slug
  },
  project3: {
    id: '7d476541-392d-47f6-9c49-650ce310f012',
    slug: 'project-3', // May need to verify actual slug
  },
  emergencyMedical: {
    id: '9251f8e9-6c63-4c41-8194-fef099905bee',
    slug: 'emergency-medical-fund-for-sarah',
  },
  homelessVeterans: {
    id: 'cbf077df-0bcd-4d64-b563-a49affb2554f',
    slug: 'emergency-housing-for-homeless-veterans',
  },
};

// Test campaign data for creation tests
export const TEST_CAMPAIGN_DATA = {
  basic: {
    title: 'E2E Test Campaign',
    summary: 'This is a test campaign created by E2E tests',
    goalAmount: 5000,
    category: 'Medical',
  },
  withDetails: {
    title: 'Detailed E2E Test Campaign',
    summary: 'A more detailed test campaign with all fields',
    goalAmount: 10000,
    category: 'Education',
    location: 'Test City, TC',
    beneficiaryName: 'Test Beneficiary',
    storyHtml: '<p>This is the story of our campaign.</p>',
  },
};

// Test donation amounts
export const TEST_DONATION_AMOUNTS = {
  small: 25,
  medium: 100,
  large: 500,
  custom: 77,
};

// Stripe test card numbers
export const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expiredCard: '4000000000000069',
  incorrectCvc: '4000000000000127',
};

// Generate random email for sign up tests
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test.user.${timestamp}.${random}@e2etest.local`;
}

// Generate random campaign title
export function generateCampaignTitle(): string {
  const timestamp = Date.now();
  return `E2E Test Campaign ${timestamp}`;
}

// Common test timeouts
export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  payment: 60000, // Stripe payments can be slow
};

// Viewport sizes for responsive tests
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  largeDesktop: { width: 1920, height: 1080 },
};

// Common selectors used across tests
export const SELECTORS = {
  // Navigation
  mainNav: '[data-testid="main-nav"]',
  mobileMenu: '[data-testid="mobile-menu"]',
  searchButton: '[data-testid="search-button"]',
  
  // Auth
  loginForm: '[data-testid="login-form"]',
  signupForm: '[data-testid="signup-form"]',
  userMenu: '[data-testid="user-menu"]',
  
  // Campaigns
  campaignCard: '[data-testid="campaign-card"]',
  campaignGrid: '[data-testid="campaign-grid"]',
  donationWidget: '[data-testid="donation-widget"]',
  
  // Common
  loadingSpinner: '[data-testid="loading-spinner"]',
  errorMessage: '[data-testid="error-message"]',
  toast: '[data-testid="toast"]',
  
  // Admin
  adminSidebar: '[data-testid="admin-sidebar"]',
  adminContent: '[data-testid="admin-content"]',
};

// Categories for filtering tests
export const CATEGORIES = [
  'Medical',
  'Education',
  'Emergency',
  'Community',
  'Animals',
  'Environment',
  'Creative',
  'Sports',
];
