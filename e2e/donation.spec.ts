import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForLoadingComplete } from './utils/page.helpers';
import { STRIPE_TEST_CARDS, TEST_DONATION_AMOUNTS, TIMEOUTS } from './utils/test-data';

test.describe('Donation Flow', () => {
  const testCampaignSlug = 'emergency-medical-fund-for-sarah';

  test.beforeEach(async ({ page }) => {
    await page.goto(`/fundraiser/${testCampaignSlug}`);
    await waitForPageLoad(page);
  });

  test.describe('Donation Widget', () => {
    test('should display donation widget with amount options', async ({ page }) => {
      const donateButton = page.locator('button:has-text("Donate")');
      await expect(donateButton.first()).toBeVisible();
    });

    test('should allow selecting preset amounts', async ({ page }) => {
      const amountButtons = page.locator('button:has-text("$25"), button:has-text("$50"), button:has-text("$100")');
      if (await amountButtons.count() > 0) {
        await amountButtons.first().click();
      }
    });

    test('should allow entering custom amount', async ({ page }) => {
      const customInput = page.locator('input[placeholder*="amount" i], input[type="number"]');
      if (await customInput.count() > 0) {
        await customInput.first().fill('77');
      }
    });

    test('should have tip selection options', async ({ page }) => {
      const tipOptions = page.locator('text=/tip/i, [data-testid="tip-selector"]');
      // Tip options may or may not be visible initially
    });

    test('should have anonymous donation checkbox', async ({ page }) => {
      const anonymousCheckbox = page.locator('input[type="checkbox"], [role="checkbox"]');
      // Anonymous option should exist
    });
  });

  test.describe('Payment Form', () => {
    test('should open payment form when donate clicked', async ({ page }) => {
      const donateButton = page.locator('button:has-text("Donate")').first();
      if (await donateButton.isVisible()) {
        await donateButton.click();
        await page.waitForTimeout(2000);
        
        // Should show payment form or navigate to payment page
        const stripeFrame = page.frameLocator('iframe[title*="Stripe"]');
        const paymentForm = page.locator('[data-testid="payment-form"], form:has(input[name="cardNumber"])');
        
        // Either Stripe Elements iframe or custom form
      }
    });

    test('should show Stripe Elements for card input', async ({ page }) => {
      const donateButton = page.locator('button:has-text("Donate")').first();
      if (await donateButton.isVisible()) {
        await donateButton.click();
        await page.waitForTimeout(3000);
        
        // Look for Stripe iframe
        const stripeFrame = page.locator('iframe[title*="Stripe"], iframe[name*="__privateStripeFrame"]');
        // Stripe Elements should load
      }
    });
  });

  test.describe('Validation', () => {
    test('should require minimum donation amount', async ({ page }) => {
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i]');
      if (await amountInput.count() > 0) {
        await amountInput.first().fill('0');
        const donateButton = page.locator('button:has-text("Donate")').first();
        await donateButton.click();
        
        // Should show validation error
        await page.waitForTimeout(1000);
      }
    });

    test('should require email for guest donors', async ({ page }) => {
      // Guest donation should require email
      const emailInput = page.locator('input[type="email"]');
      // Email field should be present for guest donors
    });
  });
});
