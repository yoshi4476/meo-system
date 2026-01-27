import { test, expect } from '@playwright/test';

test.describe('Dashboard UI', () => {
  // Mock login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should display key elements on desktop', async ({ page }) => {
    // Check for KPI cards
    await expect(page.locator('text=表示回数')).toBeVisible();
    await expect(page.locator('text=ルート検索')).toBeVisible();
    
    // Check for sidebar (desktop)
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/w-64/);
  });

  test('should have responsive mobile menu', async ({ page, isMobile }) => {
    if (!isMobile) test.skip();

    // Check hamburger menu presence
    const menuButton = page.locator('button.md\\:hidden');
    await expect(menuButton).toBeVisible();

    // Click menu
    await menuButton.click();
    
    // Check mobile sidebar (drawer) becomes visible
    // Note: implementation uses a fixed div overlay for mobile sidebar
    const mobileSidebar = page.locator('.fixed.inset-y-0.left-0');
    await expect(mobileSidebar).toBeVisible();
    
    // Close menu
    await page.locator('.fixed.inset-0.bg-black\\/50').click();
    await expect(mobileSidebar).not.toBeVisible();
  });
});
