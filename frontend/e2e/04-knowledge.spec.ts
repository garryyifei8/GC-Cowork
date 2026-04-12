import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Knowledge Base', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('navigate to knowledge base page', async ({ page }) => {
    await page.goto('/knowledge');

    await expect(page).toHaveURL(/\/knowledge/);
    await page.waitForLoadState('networkidle');

    // Page should render without errors
    await expect(page.locator('body')).toBeVisible();
  });
});
