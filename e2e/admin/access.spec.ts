import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForLoadingComplete } from '../utils/page.helpers';
import { loginAs, verifyProtectedRoute } from '../utils/auth.helpers';

test.describe('Admin Access Control', () => {
  test('should redirect non-admin users from admin routes', async ({ page }) => {
    const redirected = await verifyProtectedRoute(page, '/admin');
    expect(redirected).toBe(true);
  });

  test('should redirect from admin dashboard when not authenticated', async ({ page }) => {
    const redirected = await verifyProtectedRoute(page, '/admin/dashboard');
    expect(redirected).toBe(true);
  });

  test('should redirect from admin campaigns when not authenticated', async ({ page }) => {
    const redirected = await verifyProtectedRoute(page, '/admin/campaigns');
    expect(redirected).toBe(true);
  });

  test('should redirect from admin users when not authenticated', async ({ page }) => {
    const redirected = await verifyProtectedRoute(page, '/admin/users');
    expect(redirected).toBe(true);
  });

  test('should redirect from admin donations when not authenticated', async ({ page }) => {
    const redirected = await verifyProtectedRoute(page, '/admin/donations');
    expect(redirected).toBe(true);
  });

  test('should redirect from admin payouts when not authenticated', async ({ page }) => {
    const redirected = await verifyProtectedRoute(page, '/admin/payouts');
    expect(redirected).toBe(true);
  });

  test('should redirect from admin settings when not authenticated', async ({ page }) => {
    const redirected = await verifyProtectedRoute(page, '/admin/settings');
    expect(redirected).toBe(true);
  });

  test.skip('should allow admin access for admin users', async ({ page }) => {
    // Skip if no admin test user configured
    await loginAs(page, 'admin');
    
    await page.goto('/admin');
    await waitForPageLoad(page);
    
    // Should not be redirected to auth
    expect(page.url()).not.toContain('/auth');
    expect(page.url()).toContain('/admin');
  });
});
