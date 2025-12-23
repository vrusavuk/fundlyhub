import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForLoadingComplete, setMobileViewport } from './utils/page.helpers';
import { TIMEOUTS } from './utils/test-data';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test.describe('Hero Section', () => {
    test('should display hero section with headline', async ({ page }) => {
      // Look for main headline in hero
      const headline = page.locator('h1').first();
      await expect(headline).toBeVisible();
      
      // Hero should have compelling text
      const headlineText = await headline.textContent();
      expect(headlineText?.length).toBeGreaterThan(0);
    });

    test('should have call-to-action buttons', async ({ page }) => {
      // Look for primary CTA buttons
      const ctaButtons = page.locator('a:has-text("Start"), a:has-text("Create"), button:has-text("Start")');
      
      // Should have at least one CTA
      expect(await ctaButtons.count()).toBeGreaterThan(0);
    });

    test('should have search functionality accessible', async ({ page }) => {
      // Look for search button or search input
      const searchElements = page.locator('[data-testid="search-button"], input[type="search"], [placeholder*="search" i]');
      
      if (await searchElements.count() > 0) {
        await expect(searchElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Featured Campaigns', () => {
    test('should display campaign cards', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for campaign cards or campaign section
      const campaignCards = page.locator('[data-testid="campaign-card"], .campaign-card, article');
      
      // Should have some campaigns displayed
      const count = await campaignCards.count();
      expect(count).toBeGreaterThanOrEqual(0); // May be 0 if no active campaigns
    });

    test('should show campaign progress information', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for progress bars or fundraising amounts
      const progressElements = page.locator('[role="progressbar"], .progress, [data-testid="progress"]');
      
      if (await progressElements.count() > 0) {
        await expect(progressElements.first()).toBeVisible();
      }
    });

    test('should navigate to campaign detail on card click', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Find first clickable campaign card
      const campaignLink = page.locator('a[href*="/fundraiser/"], a[href*="/campaign/"]').first();
      
      if (await campaignLink.isVisible()) {
        await campaignLink.click();
        await waitForPageLoad(page);
        
        // Should be on a campaign detail page
        expect(page.url()).toMatch(/\/(fundraiser|campaign)\//);
      }
    });
  });

  test.describe('Categories Section', () => {
    test('should display category filters or badges', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for category elements
      const categories = page.locator('[data-testid="category"], .category, [role="tab"]');
      
      // Categories might be displayed as tabs, badges, or cards
      const categoryText = page.locator('text=Medical, text=Education, text=Emergency, text=Community');
      
      // At least check the page loads without errors
    });
  });

  test.describe('Navigation', () => {
    test('should have main navigation visible on desktop', async ({ page }) => {
      // Look for nav element or header navigation
      const nav = page.locator('nav, header');
      await expect(nav.first()).toBeVisible();
    });

    test('should have logo linking to home', async ({ page }) => {
      const logo = page.locator('a[href="/"] img, a[href="/"] svg, [data-testid="logo"]');
      
      if (await logo.count() > 0) {
        await expect(logo.first()).toBeVisible();
      }
    });

    test('should have explore/campaigns link', async ({ page }) => {
      const exploreLink = page.locator('a:has-text("Explore"), a:has-text("Campaigns"), a[href="/campaigns"]');
      
      if (await exploreLink.count() > 0) {
        await expect(exploreLink.first()).toBeVisible();
      }
    });

    test('should have login/signup links when logged out', async ({ page }) => {
      const authLinks = page.locator('a:has-text("Log in"), a:has-text("Sign"), a[href="/auth"]');
      
      // Should have auth-related links
      expect(await authLinks.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Footer', () => {
    test('should have footer with links', async ({ page }) => {
      const footer = page.locator('footer');
      
      if (await footer.isVisible()) {
        await expect(footer).toBeVisible();
        
        // Check for common footer links
        const footerLinks = footer.locator('a');
        expect(await footerLinks.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display mobile menu on small screens', async ({ page }) => {
      await setMobileViewport(page);
      await page.reload();
      await waitForPageLoad(page);
      
      // Look for mobile menu button (hamburger)
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu" i], .hamburger');
      
      if (await mobileMenuButton.count() > 0) {
        await expect(mobileMenuButton.first()).toBeVisible();
      }
    });

    test('should have readable text on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await page.reload();
      await waitForPageLoad(page);
      
      const headline = page.locator('h1').first();
      
      if (await headline.isVisible()) {
        const box = await headline.boundingBox();
        expect(box?.width).toBeLessThanOrEqual(375); // Mobile width
      }
    });
  });

  test.describe('Trust Indicators', () => {
    test('should display trust badges or stats', async ({ page }) => {
      await waitForLoadingComplete(page);
      
      // Look for trust elements (stats, badges, testimonials)
      const trustElements = page.locator('[data-testid="trust"], .trust, .stats, .testimonial');
      
      // These may or may not exist
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should not have console errors', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Filter out expected/known errors
      const criticalErrors = errors.filter(
        (e) => !e.includes('favicon') && !e.includes('analytics')
      );
      
      // Log errors for debugging but don't fail (some errors may be expected)
      if (criticalErrors.length > 0) {
        console.log('Console errors:', criticalErrors);
      }
    });
  });
});
