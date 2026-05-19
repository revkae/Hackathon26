import { test, expect } from '@playwright/test';

test('landing chat input routes to /signup with no query', async ({ page }) => {
  await page.goto('/tr');
  await page.fill('textarea.chat-textarea', 'Bana Instagram postu yaz');
  await page.click('button.chat-send.is-primary');
  await expect(page).toHaveURL(/\/tr\/signup$/);
});
