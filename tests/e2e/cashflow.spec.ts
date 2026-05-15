import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tr/login');
  await page.fill('input[name="email"]', 'ayse@seramik.com');
  await page.fill('input[name="password"]', 'AyseDemo2026!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/tr\/dashboard/, { timeout: 20000 });
});

test('cash flow scenario toggle updates chart commentary', async ({ page }) => {
  // Initial load may take a while (cash flow agent runs on server)
  await page.goto('/tr/dashboard/cashflow', { waitUntil: 'load' });
  await expect(page.locator('h1')).toContainText(/Nakit/, { timeout: 60_000 });

  // The current scenario commentary should be visible
  const commentaryBefore = await page.locator('p.whitespace-pre-wrap').first().textContent();
  expect(commentaryBefore?.length ?? 0).toBeGreaterThan(20);

  // Click %15 indirim scenario
  await page.click('button:has-text("indirim")');

  // Wait for new commentary (or risk emoji change)
  await expect(page.locator('p.whitespace-pre-wrap').first()).not.toHaveText(commentaryBefore ?? '', { timeout: 60_000 });
});
