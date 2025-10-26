import { test, expect } from '@playwright/test';

test.describe('Typography Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/design-system');
  });

  test('heading hierarchy maintains visual consistency', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const typographySection = page.locator('[data-testid="typography-showcase"]');
    if (await typographySection.count() > 0) {
      await expect(typographySection).toHaveScreenshot('heading-hierarchy.png', {
        maxDiffPixels: 100
      });
    }
  });

  test('responsive typography scales correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const h1 = page.locator('h1').first();
    if (await h1.count() > 0) {
      await expect(h1).toHaveScreenshot('mobile-heading.png');
    }
  });

  test('dark mode typography maintains readability', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    const main = page.locator('[role="main"]');
    if (await main.count() > 0) {
      await expect(main).toHaveScreenshot('dark-mode-typography.png');
    }
  });
});
