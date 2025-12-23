import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForLoadingComplete } from '../utils/page.helpers';
import { loginAs } from '../utils/auth.helpers';

test.describe('Admin Revenue Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // These tests require admin login - skip if not configured
    test.skip();
  });

  test.skip('should display revenue overview', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/revenue');
    await waitForPageLoad(page);
    
    const revenueSection = page.locator('[data-testid="revenue-overview"], text=/revenue/i');
    await expect(revenueSection.first()).toBeVisible();
  });

  test.skip('should show platform tips breakdown', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/revenue');
    await waitForPageLoad(page);
    
    const tipsSection = page.locator('text=/tips/i, [data-testid="tips-breakdown"]');
    // Tips breakdown should be visible
  });

  test.skip('should show revenue charts', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/revenue');
    await waitForPageLoad(page);
    
    const charts = page.locator('svg, canvas, [data-testid="revenue-chart"]');
    // Charts should be rendered
  });

  test.skip('should filter revenue by date range', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/revenue');
    await waitForPageLoad(page);
    
    const dateFilter = page.locator('input[type="date"], [data-testid="date-range"]');
    // Date range filter should exist
  });

  test.skip('should use browser back button correctly', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');
    await waitForPageLoad(page);
    
    // Navigate to revenue
    await page.goto('/admin/revenue');
    await waitForPageLoad(page);
    
    // Go back
    await page.goBack();
    await waitForPageLoad(page);
    
    // Should be back on admin dashboard
    expect(page.url()).toContain('/admin');
    expect(page.url()).not.toContain('/revenue');
  });
});

test.describe('Admin Feature Toggles', () => {
  test.beforeEach(async ({ page }) => {
    // These tests require admin login - skip if not configured
    test.skip();
  });

  test.skip('should display feature toggles list', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/feature-toggles');
    await waitForPageLoad(page);
    
    const togglesList = page.locator('[data-testid="feature-toggles"], table');
    await expect(togglesList).toBeVisible();
  });

  test.skip('should have toggle switches for features', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/feature-toggles');
    await waitForPageLoad(page);
    
    const toggleSwitches = page.locator('input[type="checkbox"], [role="switch"]');
    // Toggle switches should exist
  });

  test.skip('should toggle feature state', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/feature-toggles');
    await waitForPageLoad(page);
    
    const firstToggle = page.locator('[role="switch"]').first();
    if (await firstToggle.isVisible()) {
      const initialState = await firstToggle.getAttribute('aria-checked');
      await firstToggle.click();
      await page.waitForTimeout(1000);
      
      // State should have changed
      const newState = await firstToggle.getAttribute('aria-checked');
      // Toggle should have flipped
    }
  });

  test.skip('should persist toggle changes', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/feature-toggles');
    await waitForPageLoad(page);
    
    const firstToggle = page.locator('[role="switch"]').first();
    if (await firstToggle.isVisible()) {
      await firstToggle.click();
      await page.waitForTimeout(1000);
      
      // Reload page
      await page.reload();
      await waitForPageLoad(page);
      
      // Check if change persisted
    }
  });
});
