import { Page, expect, Locator } from '@playwright/test';
import { TIMEOUTS, VIEWPORTS } from './test-data';

/**
 * Page Helper Functions for E2E Tests
 */

/**
 * Wait for page to be fully loaded (no network activity)
 */
export async function waitForPageLoad(page: Page, timeout = TIMEOUTS.medium): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for any loading spinners to disappear
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  const loadingIndicators = [
    '[data-testid="loading-spinner"]',
    '.loading',
    '.skeleton',
    '[aria-busy="true"]',
  ];
  
  for (const selector of loadingIndicators) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      await element.first().waitFor({ state: 'hidden', timeout: TIMEOUTS.medium });
    }
  }
}

/**
 * Scroll element into view and wait for it to be visible
 */
export async function scrollToElement(page: Page, selector: string): Promise<Locator> {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.waitFor({ state: 'visible' });
  return element;
}

/**
 * Take a screenshot for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `test-results/debug-${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Check if a toast notification appeared
 */
export async function expectToast(
  page: Page,
  options?: { type?: 'success' | 'error' | 'info'; text?: string | RegExp }
): Promise<void> {
  const toast = page.locator('[data-testid="toast"], [role="alert"], .toast, [data-sonner-toast]');
  await expect(toast.first()).toBeVisible({ timeout: TIMEOUTS.short });
  
  if (options?.text) {
    await expect(toast.first()).toContainText(options.text);
  }
}

/**
 * Wait for toast to disappear
 */
export async function waitForToastDismiss(page: Page): Promise<void> {
  const toast = page.locator('[data-testid="toast"], [role="alert"], .toast, [data-sonner-toast]');
  if (await toast.count() > 0) {
    await toast.first().waitFor({ state: 'hidden', timeout: TIMEOUTS.medium });
  }
}

/**
 * Set viewport to mobile size
 */
export async function setMobileViewport(page: Page): Promise<void> {
  await page.setViewportSize(VIEWPORTS.mobile);
}

/**
 * Set viewport to tablet size
 */
export async function setTabletViewport(page: Page): Promise<void> {
  await page.setViewportSize(VIEWPORTS.tablet);
}

/**
 * Set viewport to desktop size
 */
export async function setDesktopViewport(page: Page): Promise<void> {
  await page.setViewportSize(VIEWPORTS.desktop);
}

/**
 * Get all visible text from an element
 */
export async function getVisibleText(page: Page, selector: string): Promise<string[]> {
  const elements = page.locator(selector);
  const count = await elements.count();
  const texts: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const text = await elements.nth(i).textContent();
    if (text) texts.push(text.trim());
  }
  
  return texts;
}

/**
 * Click and wait for navigation
 */
export async function clickAndWaitForNavigation(
  page: Page,
  selector: string,
  urlPattern?: string | RegExp
): Promise<void> {
  const navigationPromise = urlPattern
    ? page.waitForURL(urlPattern)
    : page.waitForNavigation();
  
  await page.click(selector);
  await navigationPromise;
}

/**
 * Fill form field with validation
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  const field = page.locator(selector);
  await field.click();
  await field.fill(value);
  
  // Trigger blur to ensure validation runs
  await field.blur();
}

/**
 * Select option from dropdown
 */
export async function selectOption(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  await page.click(selector);
  await page.click(`[role="option"]:has-text("${value}")`);
}

/**
 * Verify URL matches pattern
 */
export async function verifyUrl(
  page: Page,
  pattern: string | RegExp
): Promise<void> {
  if (typeof pattern === 'string') {
    expect(page.url()).toContain(pattern);
  } else {
    expect(page.url()).toMatch(pattern);
  }
}

/**
 * Get error message from form field
 */
export async function getFieldError(page: Page, fieldName: string): Promise<string | null> {
  const errorSelectors = [
    `[data-testid="${fieldName}-error"]`,
    `[name="${fieldName}"] ~ .error`,
    `#${fieldName}-error`,
    `[aria-describedby*="${fieldName}"][role="alert"]`,
  ];
  
  for (const selector of errorSelectors) {
    const error = page.locator(selector);
    if (await error.isVisible()) {
      return error.textContent();
    }
  }
  
  return null;
}

/**
 * Check if element has specific class
 */
export async function hasClass(element: Locator, className: string): Promise<boolean> {
  const classes = await element.getAttribute('class');
  return classes?.includes(className) || false;
}

/**
 * Wait for element count
 */
export async function waitForElementCount(
  page: Page,
  selector: string,
  count: number,
  timeout = TIMEOUTS.medium
): Promise<void> {
  await expect(page.locator(selector)).toHaveCount(count, { timeout });
}

/**
 * Press keyboard shortcut
 */
export async function pressShortcut(page: Page, keys: string): Promise<void> {
  await page.keyboard.press(keys);
}

/**
 * Check page accessibility
 */
export async function checkBasicAccessibility(page: Page): Promise<void> {
  // Check for main landmark
  await expect(page.locator('main, [role="main"]')).toBeVisible();
  
  // Check for page title
  const title = await page.title();
  expect(title).not.toBe('');
  
  // Check for skip link (if exists)
  const skipLink = page.locator('[href="#main-content"], [href="#content"]');
  if (await skipLink.count() > 0) {
    await expect(skipLink.first()).toBeVisible();
  }
}

/**
 * Get computed style property
 */
export async function getComputedStyle(
  page: Page,
  selector: string,
  property: string
): Promise<string> {
  return page.evaluate(
    ([sel, prop]) => {
      const element = document.querySelector(sel);
      if (!element) return '';
      return window.getComputedStyle(element).getPropertyValue(prop);
    },
    [selector, property]
  );
}
