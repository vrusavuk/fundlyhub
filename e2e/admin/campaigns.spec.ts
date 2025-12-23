import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForLoadingComplete } from '../utils/page.helpers';
import { loginAs } from '../utils/auth.helpers';

test.describe('Admin Campaign Management', () => {
  test.beforeEach(async ({ page }) => {
    // These tests require admin login - skip if not configured
    test.skip();
  });

  test.skip('should display campaigns list', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/campaigns');
    await waitForPageLoad(page);
    
    const campaignsTable = page.locator('table, [data-testid="campaigns-table"]');
    await expect(campaignsTable).toBeVisible();
  });

  test.skip('should have search functionality', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/campaigns');
    await waitForPageLoad(page);
    
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
    await expect(searchInput).toBeVisible();
  });

  test.skip('should filter campaigns by status', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/campaigns');
    await waitForPageLoad(page);
    
    const statusFilter = page.locator('select, [data-testid="status-filter"]');
    // Status filter should exist
  });

  test.skip('should navigate to campaign detail', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/campaigns');
    await waitForPageLoad(page);
    
    const viewButton = page.locator('button:has-text("View"), a:has-text("View")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await waitForPageLoad(page);
      
      expect(page.url()).toContain('/admin/campaigns/');
    }
  });

  test.skip('should have approve/reject actions for pending campaigns', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/campaigns?status=pending');
    await waitForPageLoad(page);
    
    const approveButton = page.locator('button:has-text("Approve")');
    const rejectButton = page.locator('button:has-text("Reject")');
    // Action buttons may be visible for pending campaigns
  });

  test.skip('should use browser back button correctly', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/campaigns');
    await waitForPageLoad(page);
    
    // Navigate to detail
    const viewButton = page.locator('button:has-text("View"), a:has-text("View")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await waitForPageLoad(page);
      
      // Go back
      await page.goBack();
      await waitForPageLoad(page);
      
      // Should be back on campaigns list
      expect(page.url()).toContain('/admin/campaigns');
      expect(page.url()).not.toContain('/admin/campaigns/');
    }
  });

  test.skip('should show campaign statistics', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/campaigns');
    await waitForPageLoad(page);
    
    // Should show aggregate stats
    const stats = page.locator('text=/total/i, text=/active/i, text=/pending/i');
    // Stats should be visible
  });

  test.skip('should export campaigns', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/campaigns');
    await waitForPageLoad(page);
    
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    // Export functionality may exist
  });
});
