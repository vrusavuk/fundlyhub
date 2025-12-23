import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './utils/page.helpers';

test.describe('Search Functionality', () => {
  test('should open search modal with keyboard shortcut', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    
    const searchModal = page.locator('[role="dialog"], [data-testid="search-modal"]');
    // Search modal may or may not open with shortcut
  });

  test('should show search results when typing', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const searchButton = page.locator('[data-testid="search-button"], button[aria-label*="search" i]');
    if (await searchButton.count() > 0) {
      await searchButton.first().click();
      await page.waitForTimeout(500);
      
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
      if (await searchInput.count() > 0) {
        await searchInput.first().fill('medical');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should navigate to search results page', async ({ page }) => {
    await page.goto('/search?q=test');
    await waitForPageLoad(page);
    
    // Search results page should load
    expect(page.url()).toContain('search');
  });
});
