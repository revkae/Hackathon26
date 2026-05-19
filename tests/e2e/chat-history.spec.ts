import { test, expect } from '@playwright/test';

test.describe('chat history', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tr/login');
    await page.fill('input[name="email"]', 'ayse@seramik.com');
    await page.fill('input[name="password"]', 'AyseDemo2026!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/tr\/dashboard/, { timeout: 20000 });
  });

  test('sending a message creates a conversation that survives reload', async ({ page }) => {
    await page.goto('/tr/dashboard/chat');

    const composer = page.locator('textarea.chat-textarea');
    await composer.fill('Tüm ürünlerimi listele');
    await page.click('button.chat-send.is-primary');

    // URL should update to /chat/<uuid> within a few seconds (right after the
    // 'conversation_created' event fires).
    await expect(page).toHaveURL(/\/tr\/dashboard\/chat\/[0-9a-f-]{36}$/, { timeout: 30_000 });

    const url = page.url();
    await page.reload();

    await expect(page).toHaveURL(url);
    await expect(page.locator('text=Tüm ürünlerimi listele').first()).toBeVisible();
  });
});
