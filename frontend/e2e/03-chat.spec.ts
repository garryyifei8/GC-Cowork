import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('navigate to chat page and see message input', async ({ page }) => {
    await page.goto('/chat');

    await expect(page).toHaveURL(/\/chat/);
    await page.waitForLoadState('networkidle');

    // Should have a message input area (textarea or input)
    const input = page.locator(
      'textarea, input[type="text"], [contenteditable="true"], [role="textbox"]',
    );
    await expect(input.first()).toBeVisible({ timeout: 10_000 });
  });
});
