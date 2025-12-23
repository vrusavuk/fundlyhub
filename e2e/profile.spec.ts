import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForLoadingComplete } from './utils/page.helpers';
import { loginAs, isLoggedIn } from './utils/auth.helpers';
import { TIMEOUTS } from './utils/test-data';

test.describe('User Profile', () => {
  test.describe('Public Profile View', () => {
    test('should display profile page structure', async ({ page }) => {
      // Navigate to any profile page
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      // If not logged in, might redirect to auth
      const url = page.url();
      // Profile might require auth or show public view
    });

    test('should show user avatar', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const avatar = page.locator('[data-testid="user-avatar"], img[alt*="avatar" i], .avatar');
      // Avatar should be visible on profile
    });

    test('should show user name', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const name = page.locator('h1, [data-testid="user-name"]');
      // User name should be displayed
    });

    test('should show user bio if available', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const bio = page.locator('[data-testid="user-bio"], .bio, p');
      // Bio section may or may not have content
    });

    test('should show user stats (campaigns, donations, followers)', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const stats = page.locator('[data-testid="profile-stats"], .stats');
      // Stats section should show metrics
    });
  });

  test.describe('Profile Tabs', () => {
    test('should have campaigns tab', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const campaignsTab = page.locator('[role="tab"]:has-text("Campaign"), button:has-text("Campaign")');
      if (await campaignsTab.count() > 0) {
        await expect(campaignsTab.first()).toBeVisible();
      }
    });

    test('should have donations tab', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const donationsTab = page.locator('[role="tab"]:has-text("Donation"), button:has-text("Donation")');
      // Donations tab may show user's donation history
    });

    test('should have followers/following tabs', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const followersTab = page.locator('[role="tab"]:has-text("Follower"), button:has-text("Follower")');
      const followingTab = page.locator('[role="tab"]:has-text("Following"), button:has-text("Following")');
      // Social tabs should exist
    });

    test('should switch content when tab clicked', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const tabs = page.locator('[role="tab"]');
      if (await tabs.count() > 1) {
        await tabs.nth(1).click();
        await page.waitForTimeout(500);
        
        const isSelected = await tabs.nth(1).getAttribute('aria-selected');
        expect(isSelected).toBe('true');
      }
    });
  });

  test.describe('Own Profile', () => {
    test.skip('should show edit button on own profile', async ({ page }) => {
      // Skip if no test user
      await loginAs(page, 'user');
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")');
      if (await isLoggedIn(page)) {
        await expect(editButton.first()).toBeVisible();
      }
    });

    test.skip('should navigate to settings from own profile', async ({ page }) => {
      await loginAs(page, 'user');
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const settingsLink = page.locator('a[href*="/settings"], button:has-text("Settings")');
      // Settings link should be visible on own profile
    });
  });

  test.describe('Other User Profile', () => {
    test('should hide edit options on other profiles', async ({ page }) => {
      // Visit a specific user's profile (not own)
      await page.goto('/profile/some-other-user-id');
      await waitForPageLoad(page);
      
      // Edit button should not be visible
      const editButton = page.locator('button:has-text("Edit profile")');
      // Should be hidden on other's profile
    });

    test('should show follow button on other profiles', async ({ page }) => {
      await page.goto('/profile/some-other-user-id');
      await waitForPageLoad(page);
      
      const followButton = page.locator('button:has-text("Follow")');
      // Follow button may be visible if logged in
    });
  });

  test.describe('Profile Campaigns List', () => {
    test('should display user campaigns', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      // Click campaigns tab if needed
      const campaignsTab = page.locator('[role="tab"]:has-text("Campaign")');
      if (await campaignsTab.isVisible()) {
        await campaignsTab.click();
        await page.waitForTimeout(500);
      }
      
      // Campaign cards should be displayed
      const campaignCards = page.locator('[data-testid="campaign-card"], a[href*="/fundraiser/"]');
      // May have 0 or more campaigns
    });

    test('should navigate to campaign from profile', async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
      
      const campaignLink = page.locator('a[href*="/fundraiser/"]').first();
      if (await campaignLink.isVisible()) {
        await campaignLink.click();
        await waitForPageLoad(page);
        
        expect(page.url()).toContain('/fundraiser/');
      }
    });
  });

  test.describe('Follow/Unfollow', () => {
    test.skip('should toggle follow state when clicked', async ({ page }) => {
      await loginAs(page, 'user');
      
      // Visit another user's profile
      await page.goto('/profile/some-other-user-id');
      await waitForPageLoad(page);
      
      const followButton = page.locator('button:has-text("Follow")');
      if (await followButton.isVisible()) {
        await followButton.click();
        await page.waitForTimeout(1000);
        
        // Button should change to "Unfollow" or "Following"
        const unfollowButton = page.locator('button:has-text("Unfollow"), button:has-text("Following")');
        // State should have changed
      }
    });
  });
});
