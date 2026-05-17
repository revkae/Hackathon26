import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tr/login');
  await page.fill('input[name="email"]', 'ayse@seramik.com');
  await page.fill('input[name="password"]', 'AyseDemo2026!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/tr\/dashboard/, { timeout: 20000 });
});

test('cash flow scenario toggle updates chart commentary', async ({ page }) => {
  // Page now renders instantly (deterministic chart); commentary loads async.
  await page.goto('/tr/dashboard/cashflow', { waitUntil: 'load' });
  await expect(page.locator('h1')).toContainText(/Nakit/, { timeout: 20_000 });

  // The current scenario commentary appears once Gemini responds.
  const commentary = page.locator('p.whitespace-pre-wrap').first();
  await expect(commentary).toBeVisible({ timeout: 90_000 });
  const commentaryBefore = await commentary.textContent();
  expect(commentaryBefore?.length ?? 0).toBeGreaterThan(20);

  // Click %15 indirim scenario
  await page.click('button:has-text("indirim")');

  // Wait for new commentary
  await expect(commentary).not.toHaveText(commentaryBefore ?? '', { timeout: 90_000 });
});
