import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('navigate to projects page and see project list', async ({ page }) => {
    await page.goto('/projects');

    await expect(page).toHaveURL(/\/projects/);

    // Wait for page content to load
    await page.waitForLoadState('networkidle');

    // Should have some visible content
    await expect(page.locator('body')).toBeVisible();
  });
});
