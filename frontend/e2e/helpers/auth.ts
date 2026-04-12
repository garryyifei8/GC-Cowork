import { Page } from '@playwright/test';

/**
 * Login helper that directly sets the auth token in localStorage.
 * This bypasses the login UI for faster E2E tests.
 * Uses the built-in admin account from the seed data.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  // Navigate to app first to set localStorage on the correct origin
  await page.goto('/');

  // Call the login API to get a real token
  const response = await page.request.post('/api/auth/login', {
    data: {
      username: 'admin',
      password: 'admin123',
    },
  });

  if (response.ok()) {
    const body = await response.json();
    const token = body.access_token || body.token;
    if (token) {
      await page.evaluate((t) => {
        localStorage.setItem('access_token', t);
      }, token);
      // Reload to pick up the token
      await page.reload();
      return;
    }
  }

  // Fallback: set a mock token for environments without a running backend
  await page.evaluate(() => {
    localStorage.setItem('access_token', 'e2e-test-token');
  });
  await page.reload();
}
