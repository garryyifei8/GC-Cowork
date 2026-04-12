import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('navigate to tasks page', async ({ page }) => {
    await page.goto('/tasks');

    await expect(page).toHaveURL(/\/tasks/);
    await page.waitForLoadState('networkidle');

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });
});
