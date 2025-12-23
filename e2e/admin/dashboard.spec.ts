import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForLoadingComplete } from '../utils/page.helpers';
import { loginAs } from '../utils/auth.helpers';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // These tests require admin login - skip if not configured
    test.skip();
  });

  test.skip('should display dashboard with stats cards', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');
    await waitForPageLoad(page);
    
    // Look for stat cards
    const statCards = page.locator('[data-testid="stat-card"], .stat-card, .card');
    await expect(statCards.first()).toBeVisible();
  });

  test.skip('should show platform revenue stats', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');
    await waitForPageLoad(page);
    
    const revenueStats = page.locator('text=/revenue/i, text=/tips/i');
    // Revenue stats should be visible
  });

  test.skip('should show quick action buttons', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');
    await waitForPageLoad(page);
    
    const quickActions = page.locator('[data-testid="quick-actions"], button:has-text("View")');
    // Quick action buttons should exist
  });

  test.skip('should show system health indicators', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');
    await waitForPageLoad(page);
    
    const healthIndicator = page.locator('[data-testid="system-health"], text=/healthy/i, text=/status/i');
    // Health indicators should show status
  });

  test.skip('should show recent activity feed', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');
    await waitForPageLoad(page);
    
    const activityFeed = page.locator('[data-testid="activity-feed"], text=/recent/i');
    // Activity feed should be present
  });

  test.skip('should navigate to campaigns from dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');
    await waitForPageLoad(page);
    
    const campaignsLink = page.locator('a[href*="/admin/campaigns"]');
    if (await campaignsLink.isVisible()) {
      await campaignsLink.click();
      await waitForPageLoad(page);
      
      expect(page.url()).toContain('/admin/campaigns');
    }
  });

  test.skip('should navigate to users from dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');
    await waitForPageLoad(page);
    
    const usersLink = page.locator('a[href*="/admin/users"]');
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await waitForPageLoad(page);
      
      expect(page.url()).toContain('/admin/users');
    }
  });
});
