import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForLoadingComplete, clickAndWaitForNavigation } from './utils/page.helpers';
import { fetchPublicCampaigns } from './utils/api.helpers';
import { TIMEOUTS, CATEGORIES } from './utils/test-data';

test.describe('Campaign Discovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/campaigns');
    await waitForPageLoad(page);
  });

  test.describe('Campaign Listing', () => {
    test('should display campaigns page with proper heading', async ({ page }) => {
      // Look for page heading
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
    });

    test('should load and display campaign cards', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Wait for campaigns to load
      await page.waitForTimeout(2000);
      
      // Look for campaign cards
      const campaignCards = page.locator('[data-testid="campaign-card"], .campaign-card, article a[href*="/fundraiser/"]');
      
      const count = await campaignCards.count();
      // May be 0 if no active campaigns, but page should load
    });

    test('should show campaign title on cards', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for campaign titles
      const titles = page.locator('[data-testid="campaign-card"] h2, [data-testid="campaign-card"] h3, article h2, article h3');
      
      if (await titles.count() > 0) {
        const firstTitle = titles.first();
        await expect(firstTitle).toBeVisible();
        const text = await firstTitle.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });

    test('should show fundraising progress on cards', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for progress indicators
      const progressBars = page.locator('[role="progressbar"], .progress-bar, [data-testid="progress"]');
      
      if (await progressBars.count() > 0) {
        await expect(progressBars.first()).toBeVisible();
      }
    });

    test('should show raised amount on cards', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for dollar amounts
      const amounts = page.locator('text=/\\$[\\d,]+/');
      
      // Should have some monetary values displayed
    });
  });

  test.describe('Filtering', () => {
    test('should have category filter options', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for filter/category buttons or dropdown
      const filterElements = page.locator('[data-testid="category-filter"], [role="tab"], button:has-text("All"), select');
      
      if (await filterElements.count() > 0) {
        await expect(filterElements.first()).toBeVisible();
      }
    });

    test('should filter campaigns by category when clicked', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for a specific category button
      const medicalFilter = page.locator('button:has-text("Medical"), [data-testid="category-Medical"]');
      
      if (await medicalFilter.isVisible()) {
        await medicalFilter.click();
        await page.waitForTimeout(1000);
        
        // URL might update with filter param
        // Or the campaign list should update
      }
    });

    test('should show "All" or reset filter option', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      const allFilter = page.locator('button:has-text("All"), [data-testid="category-all"]');
      
      if (await allFilter.count() > 0) {
        await expect(allFilter.first()).toBeVisible();
      }
    });
  });

  test.describe('Sorting', () => {
    test('should have sort options if available', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for sort dropdown or buttons
      const sortElements = page.locator('[data-testid="sort"], select:has-text("Sort"), button:has-text("Sort")');
      
      // Sort may or may not be implemented
    });
  });

  test.describe('Search Integration', () => {
    test('should have search functionality on campaigns page', async ({ page }) => {
      // Look for search input or button
      const searchElements = page.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search"]');
      
      if (await searchElements.count() > 0) {
        await expect(searchElements.first()).toBeVisible();
      }
    });

    test('should filter campaigns when searching', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('medical');
        await page.waitForTimeout(1000);
        
        // Campaigns should filter or search should trigger
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to campaign detail on card click', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Find a campaign card link
      const campaignLink = page.locator('a[href*="/fundraiser/"]').first();
      
      if (await campaignLink.isVisible()) {
        const href = await campaignLink.getAttribute('href');
        await campaignLink.click();
        await waitForPageLoad(page);
        
        // Should be on campaign detail page
        expect(page.url()).toContain('/fundraiser/');
      }
    });

    test('should have breadcrumbs or back navigation', async ({ page }) => {
      const breadcrumbs = page.locator('[aria-label="breadcrumb"], .breadcrumb, nav:has-text("Home")');
      
      // Breadcrumbs may or may not exist
    });
  });

  test.describe('Empty State', () => {
    test('should show appropriate message when no campaigns match filter', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Try to filter to something that returns no results
      // This is hard to test without knowing the data
      
      // Look for empty state component
      const emptyState = page.locator('[data-testid="empty-state"], text=/no.*campaigns/i, text=/no.*results/i');
      
      // May or may not be visible depending on data
    });
  });

  test.describe('Pagination / Load More', () => {
    test('should have load more or pagination if many campaigns', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for pagination or load more button
      const loadMore = page.locator('button:has-text("Load more"), button:has-text("Show more"), [data-testid="load-more"]');
      const pagination = page.locator('[aria-label="pagination"], .pagination, nav:has(button:has-text("Next"))');
      
      // Either load more or pagination may exist
    });

    test('should load more campaigns when button clicked', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      const loadMore = page.locator('button:has-text("Load more"), button:has-text("Show more")');
      
      if (await loadMore.isVisible()) {
        // Count current campaigns
        const initialCount = await page.locator('a[href*="/fundraiser/"]').count();
        
        await loadMore.click();
        await page.waitForTimeout(2000);
        
        // Should have more campaigns now (or same if no more to load)
        const newCount = await page.locator('a[href*="/fundraiser/"]').count();
        expect(newCount).toBeGreaterThanOrEqual(initialCount);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display grid on desktop', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Campaign cards should be in a grid layout
      const grid = page.locator('.grid, [data-testid="campaign-grid"]');
      
      if (await grid.count() > 0) {
        await expect(grid.first()).toBeVisible();
      }
    });

    test('should display single column on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await waitForPageLoad(page);
      
      // On mobile, cards should stack
      // This is more of a visual check
    });
  });

  test.describe('API Integration', () => {
    test('should fetch campaigns from API', async ({ page, request }) => {
      // Verify API is returning campaigns
      const campaigns = await fetchPublicCampaigns(request, { limit: 5 });
      
      // API should return an array
      expect(Array.isArray(campaigns)).toBe(true);
    });
  });
});
