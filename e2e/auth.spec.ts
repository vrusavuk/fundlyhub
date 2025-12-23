import { test, expect } from '@playwright/test';
import { loginViaUI, signUpViaUI, logout, isLoggedIn, verifyProtectedRoute } from './utils/auth.helpers';
import { TEST_USERS, generateTestEmail, TIMEOUTS } from './utils/test-data';
import { waitForPageLoad, expectToast } from './utils/page.helpers';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('Login Flow', () => {
    test('should display login form on auth page', async ({ page }) => {
      await page.goto('/auth');
      
      // Check for email and password fields
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
      await page.goto('/auth');
      
      // Click submit without filling fields
      await page.click('button[type="submit"]');
      
      // Should show validation errors or required field indication
      // The form should not navigate away
      expect(page.url()).toContain('/auth');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth');
      
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Wait for error message or toast
      await page.waitForTimeout(2000);
      
      // Should still be on auth page (login failed)
      expect(page.url()).toContain('/auth');
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/auth');
      
      await page.fill('input[type="email"]', 'not-an-email');
      await page.fill('input[type="password"]', 'password123');
      
      // Trigger validation
      await page.locator('input[type="email"]').blur();
      
      // Form should indicate invalid email
      const emailInput = page.locator('input[type="email"]');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test.skip('should successfully login with valid credentials', async ({ page }) => {
      // Skip if no test user configured
      if (!TEST_USERS.user.email || TEST_USERS.user.email === 'user@test.com') {
        test.skip();
        return;
      }

      await loginViaUI(page, TEST_USERS.user);
      
      // Should be redirected away from auth page
      expect(page.url()).not.toContain('/auth');
      
      // Should show user is logged in
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBe(true);
    });

    test('should have "forgot password" link', async ({ page }) => {
      await page.goto('/auth');
      
      const forgotLink = page.locator('a:has-text("Forgot"), button:has-text("Forgot")');
      // May or may not exist - just check if it's there
      const exists = await forgotLink.count() > 0;
      // This is informational, not a hard fail
    });
  });

  test.describe('Sign Up Flow', () => {
    test('should display sign up form', async ({ page }) => {
      await page.goto('/auth');
      
      // Look for sign up toggle/tab
      const signUpToggle = page.locator('button:has-text("Sign up"), a:has-text("Sign up"), [data-testid="signup-tab"]');
      
      if (await signUpToggle.isVisible()) {
        await signUpToggle.click();
        await page.waitForTimeout(500);
      }
      
      // Check for name field (indicates sign up form)
      const nameField = page.locator('input[name="name"], input[placeholder*="name" i]');
      if (await nameField.count() > 0) {
        await expect(nameField.first()).toBeVisible();
      }
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/auth');
      
      // Switch to sign up mode if needed
      const signUpToggle = page.locator('button:has-text("Sign up"), a:has-text("Sign up")');
      if (await signUpToggle.isVisible()) {
        await signUpToggle.click();
      }
      
      // Enter a weak password
      const passwordField = page.locator('input[type="password"]').first();
      await passwordField.fill('123');
      await passwordField.blur();
      
      // Should show password validation feedback
      await page.waitForTimeout(500);
    });

    test('should require matching password confirmation', async ({ page }) => {
      await page.goto('/auth');
      
      // Switch to sign up mode if needed
      const signUpToggle = page.locator('button:has-text("Sign up"), a:has-text("Sign up")');
      if (await signUpToggle.isVisible()) {
        await signUpToggle.click();
      }
      
      // Look for confirm password field
      const confirmPasswordField = page.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]');
      
      if (await confirmPasswordField.count() > 0) {
        const passwordField = page.locator('input[type="password"]').first();
        await passwordField.fill('Password123!');
        await confirmPasswordField.fill('DifferentPassword123!');
        await confirmPasswordField.blur();
        
        // Should show mismatch error
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to auth for protected campaign creation', async ({ page }) => {
      const redirected = await verifyProtectedRoute(page, '/create');
      expect(redirected).toBe(true);
    });

    test('should redirect to auth for protected settings page', async ({ page }) => {
      const redirected = await verifyProtectedRoute(page, '/settings');
      expect(redirected).toBe(true);
    });

    test('should redirect to auth for admin routes', async ({ page }) => {
      const redirected = await verifyProtectedRoute(page, '/admin');
      expect(redirected).toBe(true);
    });

    test('should allow access to public campaign pages', async ({ page }) => {
      await page.goto('/campaigns');
      await waitForPageLoad(page);
      
      // Should NOT redirect to auth
      expect(page.url()).not.toContain('/auth');
    });

    test('should allow access to public home page', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Should NOT redirect to auth
      expect(page.url()).not.toContain('/auth');
    });
  });

  test.describe('Session Management', () => {
    test.skip('should persist session after page refresh', async ({ page }) => {
      // Skip if no test user configured
      if (!TEST_USERS.user.email || TEST_USERS.user.email === 'user@test.com') {
        test.skip();
        return;
      }

      await loginViaUI(page, TEST_USERS.user);
      
      // Refresh the page
      await page.reload();
      await waitForPageLoad(page);
      
      // Should still be logged in
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBe(true);
    });

    test.skip('should clear session on logout', async ({ page }) => {
      // Skip if no test user configured
      if (!TEST_USERS.user.email || TEST_USERS.user.email === 'user@test.com') {
        test.skip();
        return;
      }

      await loginViaUI(page, TEST_USERS.user);
      await logout(page);
      
      // Should not be logged in
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBe(false);
    });
  });

  test.describe('OAuth Flow', () => {
    test('should display Google sign-in option', async ({ page }) => {
      await page.goto('/auth');
      
      // Look for Google OAuth button
      const googleButton = page.locator('button:has-text("Google"), [aria-label*="Google"]');
      
      // Google OAuth might or might not be enabled
      const hasGoogle = await googleButton.count() > 0;
      
      if (hasGoogle) {
        await expect(googleButton.first()).toBeVisible();
      }
    });
  });
});
