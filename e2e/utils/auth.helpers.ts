import { Page, expect } from '@playwright/test';
import { TEST_USERS } from './test-data';

/**
 * Authentication Helper Functions for E2E Tests
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login via the UI login form
 */
export async function loginViaUI(page: Page, credentials: LoginCredentials): Promise<void> {
  await page.goto('/auth');
  
  // Wait for the login form to be visible
  await page.waitForSelector('input[type="email"]', { state: 'visible' });
  
  // Fill in credentials
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for navigation away from auth page
  await page.waitForURL((url) => !url.pathname.includes('/auth'), {
    timeout: 10000,
  });
}

/**
 * Login as a test user by role
 */
export async function loginAs(page: Page, role: 'admin' | 'user' | 'creator'): Promise<void> {
  const user = TEST_USERS[role];
  if (!user) {
    throw new Error(`No test user configured for role: ${role}`);
  }
  await loginViaUI(page, user);
}

/**
 * Logout via the UI
 */
export async function logout(page: Page): Promise<void> {
  // Look for user menu or logout button
  const userMenu = page.locator('[data-testid="user-menu"]');
  
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.click('[data-testid="logout-button"]');
  } else {
    // Try direct logout button
    const logoutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
  }
  
  // Wait for redirect to home or auth page
  await page.waitForURL((url) => 
    url.pathname === '/' || url.pathname.includes('/auth')
  );
}

/**
 * Check if user is currently logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for presence of user-specific elements
  const userIndicators = [
    '[data-testid="user-menu"]',
    '[data-testid="user-avatar"]',
    'button:has-text("Sign out")',
  ];
  
  for (const selector of userIndicators) {
    if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Sign up a new user via UI
 */
export async function signUpViaUI(
  page: Page,
  data: { email: string; password: string; name: string }
): Promise<void> {
  await page.goto('/auth');
  
  // Click on sign up toggle if needed
  const signUpToggle = page.locator('button:has-text("Sign up"), a:has-text("Sign up")');
  if (await signUpToggle.isVisible()) {
    await signUpToggle.click();
  }
  
  // Fill in sign up form
  await page.fill('input[name="name"]', data.name);
  await page.fill('input[type="email"]', data.email);
  await page.fill('input[type="password"]', data.password);
  
  // Submit
  await page.click('button[type="submit"]');
}

/**
 * Wait for auth state to be ready
 */
export async function waitForAuthReady(page: Page): Promise<void> {
  // Wait for any auth loading states to complete
  await page.waitForLoadState('networkidle');
  
  // Give React time to update auth context
  await page.waitForTimeout(500);
}

/**
 * Ensure user is logged out before test
 */
export async function ensureLoggedOut(page: Page): Promise<void> {
  if (await isLoggedIn(page)) {
    await logout(page);
  }
}

/**
 * Navigate to a protected route and verify redirect to auth
 */
export async function verifyProtectedRoute(page: Page, route: string): Promise<boolean> {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  
  // Check if redirected to auth page
  return page.url().includes('/auth');
}
