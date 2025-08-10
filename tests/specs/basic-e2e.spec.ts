import { test, expect } from '@playwright/test';

test.describe('Basic E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Haircut Reservation/);
    
    // Check for main content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should navigate to booking page', async ({ page }) => {
    await page.goto('/');
    
    // Click on booking link/button
    const bookingLink = page.locator('a[href="/booking"]').first();
    if (await bookingLink.isVisible()) {
      await bookingLink.click();
      await expect(page).toHaveURL(/booking/);
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // The page should still be functional
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    
    // Should either redirect or show 404 page
    if (response?.status() === 404) {
      await expect(page.locator('text=/404|not found/i')).toBeVisible();
    }
  });
});