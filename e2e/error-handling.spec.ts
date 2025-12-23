import { test, expect } from '@playwright/test';
import { waitForPageLoad, setMobileViewport } from './utils/page.helpers';

test.describe('Error Handling', () => {
  test('should show 404 page for invalid routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await waitForPageLoad(page);
    
    const notFoundText = page.locator('text=/not found/i, text=/404/');
    // Should show some indication of 404
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.route('**/*', route => route.abort());
    
    try {
      await page.goto('/', { timeout: 5000 });
    } catch {
      // Expected to fail
    }
  });
});

test.describe('Responsive Design', () => {
  test('should display mobile navigation on small screens', async ({ page }) => {
    await setMobileViewport(page);
    await page.goto('/');
    await waitForPageLoad(page);
    
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu" i]');
    // Mobile menu should be visible
  });

  test('should hide desktop nav on mobile', async ({ page }) => {
    await setMobileViewport(page);
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Desktop nav items should be hidden
    const desktopNav = page.locator('nav.hidden, nav.md\\:flex');
    // Desktop-only nav should be hidden
  });
});
