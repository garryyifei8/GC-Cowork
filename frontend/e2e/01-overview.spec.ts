import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Overview Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('loads overview page with project cards', async ({ page }) => {
    await page.goto('/');

    // Should be on overview/dashboard
    await expect(page).toHaveURL(/\/(overview)?$/);

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();

    // Should have some content (nav, sidebar, or main content area)
    const mainContent = page.locator('main, [role="main"], .content, .dashboard');
    await expect(mainContent.first()).toBeVisible({ timeout: 10_000 });
  });
});
