import { test, expect } from '@playwright/test';

test.describe('Captain chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tr/login');
    await page.fill('input[name="email"]', 'ayse@seramik.com');
    await page.fill('input[name="password"]', 'AyseDemo2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/tr\/dashboard/, { timeout: 20000 });
  });

  test('captain responds to a simple question', async ({ page }) => {
    await page.goto('/tr/dashboard/chat');
    await expect(page.locator('h1')).toContainText(/Sohbet/);
    await page.fill('input[placeholder*="Sor"]', 'Tüm ürünlerimi listele');
    await page.click('button:has(svg)');
    await expect(
      page.locator('text=/Vazo|Fincan|Tabak|ürün|product/i').first()
    ).toBeVisible({ timeout: 60_000 });
  });
});
