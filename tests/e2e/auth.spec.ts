import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/tr\/login/);
    await expect(page.locator('h2')).toContainText(/Giriş/);
  });

  test('logs in with seed credentials and redirects to dashboard', async ({ page }) => {
    await page.goto('/tr/login');
    await page.fill('input[name="email"]', 'ayse@seramik.com');
    await page.fill('input[name="password"]', 'AyseDemo2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/tr\/dashboard/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Günaydın/, { timeout: 20000 });
  });

  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/tr/login');
    await page.fill('input[name="email"]', 'ayse@seramik.com');
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    // Sonner toast renders the error
    await expect(page.locator('text=/credentials|invalid|hata/i')).toBeVisible({ timeout: 5000 });
  });
});
