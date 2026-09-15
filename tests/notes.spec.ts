import { expect, test } from '@playwright/test';

test('mobile notes filters expose their state and support keyboard selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/notes');
  const all = page.getByRole('button', { name: 'All', exact: true });
  const vue = page.getByRole('button', { name: 'vue', exact: true });
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.fn-entry')).toHaveCount(3);
  for (const chip of await page.locator('.fn-chip').all()) {
    expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await vue.focus();
  await page.keyboard.press('Enter');
  await expect(vue).toHaveAttribute('aria-pressed', 'true');
  await expect(all).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.fn-entry')).toHaveCount(1);
  await expect(page.locator('.fn-title')).toHaveText('Three Frameworks, One Site');
  await page.keyboard.press('Enter');
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.fn-entry')).toHaveCount(3);
});

test('all notes retain readable mobile layouts, active navigation and a usable return link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const slug of ['three-frameworks-one-site', 'on-building-with-constraints', 'the-grid-engine']) {
    const response = await page.goto(`/notes/${slug}`);
    expect(response!.status()).toBe(200);
    await expect(page.getByRole('link', { name: 'Notes', exact: true })).toHaveAttribute('aria-current', 'page');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const back = page.locator('.note-back');
    expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.locator('.note-prose p').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    await back.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/notes');
  }
});
