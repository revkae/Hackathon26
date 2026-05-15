import { test, expect } from '@playwright/test';

test('language toggle switches UI strings', async ({ page }) => {
  // Login first
  await page.goto('/tr/login');
  await page.fill('input[name="email"]', 'ayse@seramik.com');
  await page.fill('input[name="password"]', 'AyseDemo2026!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/tr\/dashboard/, { timeout: 20000 });

  // Verify Turkish dashboard heading
  await expect(page.locator('h1')).toContainText(/Günaydın/);

  // Open language dropdown — the toggle button shows "🇹🇷 TR"
  await page.click('button:has-text("TR")');
  // Click the English option
  await page.click('text=/English/');

  // After locale switch, URL should change
  await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 10000 });
  // English heading
  await expect(page.locator('h1')).toContainText(/Good morning/, { timeout: 10000 });
});
