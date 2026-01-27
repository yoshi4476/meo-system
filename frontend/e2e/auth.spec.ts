import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page and login successfully', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/MEO Mastermind/);
    
    // 2. Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // 3. Submit
    await page.click('button[type="submit"]');
    
    // 4. Verify redirection to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // 5. Verify dashboard content
    await expect(page.locator('h1').first()).toContainText('おはようございます');
  });
});
