import { test, expect } from '@playwright/test';

test('keyboard focus draws a contact connection and Escape clears it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/contact');
  await page.locator('astro-island[component-url*="ContactPage"]:not([ssr])').waitFor();
  const github = page.getByRole('link', { name: /GitHub:/ });
  await github.focus();
  await expect(page.locator('.cm-flow')).toHaveCount(5);
  await expect.poll(() => page.locator('.cm-flow').first().getAttribute('x2')).not.toBe('340');
  await expect(page.getByRole('status')).toContainText('GitHub');
  await page.keyboard.press('Escape');
  await expect(page.locator('.cm-flow')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Six ways to get in touch.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await github.focus();
  await expect(page.locator('.cm-flow')).toHaveCount(5);
  await expect.poll(() => page.locator('.cm-apparatus').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  expect(errors).toEqual([]);
});

test('a narrow touch layout opens its channel immediately', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 740 }, hasTouch: true });
  await context.route('https://github.com/CJ-Uy', route => route.fulfill({ contentType: 'text/html', body: 'Contact destination' }));
  const page = await context.newPage();
  await page.goto('/contact');
  await page.locator('astro-island[component-url*="ContactPage"]:not([ssr])').waitFor();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const opened = page.waitForEvent('popup');
  await page.getByRole('link', { name: /GitHub:/ }).tap();
  const destination = await opened;
  await expect(destination).toHaveURL('https://github.com/CJ-Uy');
  await expect(page.getByRole('button', { name: /Open channel|Cancel/ })).toHaveCount(0);
  await context.close();
});
