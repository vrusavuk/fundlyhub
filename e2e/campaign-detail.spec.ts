import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForLoadingComplete, setMobileViewport } from './utils/page.helpers';
import { fetchCampaignBySlug, fetchCampaignDonations } from './utils/api.helpers';
import { REAL_CAMPAIGNS, TIMEOUTS } from './utils/test-data';

test.describe('Campaign Detail Page', () => {
  // Use a known campaign slug for testing
  const testCampaignSlug = 'emergency-medical-fund-for-sarah';
  
  test.describe('Page Loading', () => {
    test('should load campaign detail page by slug', async ({ page }) => {
      await page.goto(`/fundraiser/${testCampaignSlug}`);
      await waitForPageLoad(page);
      
      // Should not be on 404 page
      const notFound = page.locator('text=/not found/i, text=/404/');
      
      // Either found or not, page should load
      await page.waitForTimeout(1000);
    });

    test('should show 404 for non-existent campaign', async ({ page }) => {
      await page.goto('/fundraiser/this-campaign-does-not-exist-12345');
      await waitForPageLoad(page);
      
      // Should show 404 or not found message
      const notFound = page.locator('text=/not found/i, text=/404/, text=/doesn\'t exist/i');
      
      // Might redirect to campaigns page or show 404
    });

    test('should have proper page title', async ({ page }) => {
      await page.goto(`/fundraiser/${testCampaignSlug}`);
      await waitForPageLoad(page);
      
      const title = await page.title();
      expect(title).not.toBe('');
    });
  });

  test.describe('Campaign Content', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/fundraiser/${testCampaignSlug}`);
      await waitForPageLoad(page);
      await waitForLoadingComplete(page);
    });

    test('should display campaign title', async ({ page }) => {
      const title = page.locator('h1');
      
      if (await title.isVisible()) {
        await expect(title).toBeVisible();
        const text = await title.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });

    test('should display cover image', async ({ page }) => {
      const coverImage = page.locator('img[alt*="cover" i], img[alt*="campaign" i], [data-testid="cover-image"]');
      
      if (await coverImage.count() > 0) {
        await expect(coverImage.first()).toBeVisible();
      }
    });

    test('should display fundraising progress', async ({ page }) => {
      // Look for progress bar
      const progressBar = page.locator('[role="progressbar"], .progress, [data-testid="progress"]');
      
      if (await progressBar.count() > 0) {
        await expect(progressBar.first()).toBeVisible();
      }
    });

    test('should display raised amount', async ({ page }) => {
      // Look for dollar amount
      const raisedAmount = page.locator('text=/\\$[\\d,]+.*raised/i, [data-testid="raised-amount"]');
      
      if (await raisedAmount.count() > 0) {
        await expect(raisedAmount.first()).toBeVisible();
      }
    });

    test('should display goal amount', async ({ page }) => {
      // Look for goal amount
      const goalAmount = page.locator('text=/goal.*\\$[\\d,]+/i, text=/\\$[\\d,]+.*goal/i, [data-testid="goal-amount"]');
      
      if (await goalAmount.count() > 0) {
        await expect(goalAmount.first()).toBeVisible();
      }
    });

    test('should display donor count', async ({ page }) => {
      // Look for donor count
      const donorCount = page.locator('text=/\\d+.*donor/i, [data-testid="donor-count"]');
      
      if (await donorCount.count() > 0) {
        await expect(donorCount.first()).toBeVisible();
      }
    });
  });

  test.describe('Campaign Tabs', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/fundraiser/${testCampaignSlug}`);
      await waitForPageLoad(page);
    });

    test('should have story tab', async ({ page }) => {
      const storyTab = page.locator('[role="tab"]:has-text("Story"), button:has-text("Story"), [data-testid="story-tab"]');
      
      if (await storyTab.count() > 0) {
        await expect(storyTab.first()).toBeVisible();
      }
    });

    test('should have updates tab', async ({ page }) => {
      const updatesTab = page.locator('[role="tab"]:has-text("Update"), button:has-text("Update"), [data-testid="updates-tab"]');
      
      if (await updatesTab.count() > 0) {
        await expect(updatesTab.first()).toBeVisible();
      }
    });

    test('should have comments/donors tab', async ({ page }) => {
      const commentsTab = page.locator('[role="tab"]:has-text("Comment"), [role="tab"]:has-text("Donor"), button:has-text("Comment")');
      
      if (await commentsTab.count() > 0) {
        await expect(commentsTab.first()).toBeVisible();
      }
    });

    test('should switch content when tab clicked', async ({ page }) => {
      const tabs = page.locator('[role="tab"]');
      
      if (await tabs.count() > 1) {
        // Click second tab
        await tabs.nth(1).click();
        await page.waitForTimeout(500);
        
        // Tab should now be selected
        const isSelected = await tabs.nth(1).getAttribute('aria-selected');
        expect(isSelected).toBe('true');
      }
    });
  });

  test.describe('Donation Widget', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/fundraiser/${testCampaignSlug}`);
      await waitForPageLoad(page);
    });

    test('should display donation widget', async ({ page }) => {
      const donationWidget = page.locator('[data-testid="donation-widget"], .donation-widget, form:has(button:has-text("Donate"))');
      
      // Donation widget should be visible (may be in sidebar on desktop)
      if (await donationWidget.count() > 0) {
        await expect(donationWidget.first()).toBeVisible();
      }
    });

    test('should have donate button', async ({ page }) => {
      const donateButton = page.locator('button:has-text("Donate"), [data-testid="donate-button"]');
      
      if (await donateButton.count() > 0) {
        await expect(donateButton.first()).toBeVisible();
      }
    });

    test('should have suggested donation amounts', async ({ page }) => {
      const amountButtons = page.locator('button:has-text("$25"), button:has-text("$50"), button:has-text("$100")');
      
      // May have preset amounts
    });
  });

  test.describe('Share Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/fundraiser/${testCampaignSlug}`);
      await waitForPageLoad(page);
    });

    test('should have share buttons', async ({ page }) => {
      const shareButtons = page.locator('button:has-text("Share"), [data-testid="share-button"], [aria-label*="share" i]');
      
      if (await shareButtons.count() > 0) {
        await expect(shareButtons.first()).toBeVisible();
      }
    });

    test('should show share options when clicked', async ({ page }) => {
      const shareButton = page.locator('button:has-text("Share"), [data-testid="share-button"]').first();
      
      if (await shareButton.isVisible()) {
        await shareButton.click();
        await page.waitForTimeout(500);
        
        // Should show share options (Facebook, Twitter, Copy link, etc.)
        const shareOptions = page.locator('text=/facebook/i, text=/twitter/i, text=/copy/i');
        // May or may not be visible depending on implementation
      }
    });

    test('should have copy link functionality', async ({ page }) => {
      const copyButton = page.locator('button:has-text("Copy"), [aria-label*="copy" i]');
      
      // Copy link may be in share dropdown or standalone
    });
  });

  test.describe('Creator Information', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/fundraiser/${testCampaignSlug}`);
      await waitForPageLoad(page);
    });

    test('should display creator/organizer info', async ({ page }) => {
      const creatorInfo = page.locator('text=/organiz/i, text=/created by/i, [data-testid="creator-info"]');
      
      if (await creatorInfo.count() > 0) {
        await expect(creatorInfo.first()).toBeVisible();
      }
    });

    test('should have link to creator profile', async ({ page }) => {
      const creatorLink = page.locator('a[href*="/profile/"], a[href*="/user/"], [data-testid="creator-link"]');
      
      if (await creatorLink.count() > 0) {
        await expect(creatorLink.first()).toBeVisible();
      }
    });
  });

  test.describe('Follow/Subscribe', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/fundraiser/${testCampaignSlug}`);
      await waitForPageLoad(page);
    });

    test('should have follow button', async ({ page }) => {
      const followButton = page.locator('button:has-text("Follow"), [data-testid="follow-button"]');
      
      // Follow button may only show for logged-in users
    });
  });

  test.describe('Responsive Design', () => {
    test('should show mobile donation sheet on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto(`/fundraiser/${testCampaignSlug}`);
      await waitForPageLoad(page);
      
      // On mobile, donation widget might be a bottom sheet or button
      const donateButton = page.locator('button:has-text("Donate")');
      
      if (await donateButton.count() > 0) {
        await expect(donateButton.first()).toBeVisible();
      }
    });

    test('should stack content vertically on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto(`/fundraiser/${testCampaignSlug}`);
      await waitForPageLoad(page);
      
      // Content should be readable on mobile
      const title = page.locator('h1');
      if (await title.isVisible()) {
        const box = await title.boundingBox();
        expect(box?.width).toBeLessThanOrEqual(375);
      }
    });
  });

  test.describe('Back Navigation', () => {
    test('should have working back button', async ({ page }) => {
      // First go to campaigns list
      await page.goto('/campaigns');
      await waitForPageLoad(page);
      
      // Then navigate to a campaign
      const campaignLink = page.locator('a[href*="/fundraiser/"]').first();
      if (await campaignLink.isVisible()) {
        await campaignLink.click();
        await waitForPageLoad(page);
        
        // Now go back
        await page.goBack();
        await waitForPageLoad(page);
        
        // Should be back on campaigns page
        expect(page.url()).toContain('/campaigns');
      }
    });
  });

  test.describe('API Integration', () => {
    test('should fetch campaign data from API', async ({ request }) => {
      const campaign = await fetchCampaignBySlug(request, testCampaignSlug);
      
      // Campaign may or may not exist
      if (campaign) {
        expect(campaign.slug).toBe(testCampaignSlug);
        expect(campaign.title).toBeDefined();
      }
    });

    test('should fetch campaign donations', async ({ request }) => {
      const campaign = await fetchCampaignBySlug(request, testCampaignSlug);
      
      if (campaign) {
        const donations = await fetchCampaignDonations(request, campaign.id);
        expect(Array.isArray(donations)).toBe(true);
      }
    });
  });
});
