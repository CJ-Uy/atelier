import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/works');
  await page.locator('astro-island[component-url*="WorksPage"]:not([ssr])').waitFor();
});

test('mobile Works header and controls fit without overlap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'How to read a circle' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const mark = await page.locator('.ph-circlemark').boundingBox();
  const copy = await page.locator('.ph-sub').boundingBox();
  expect(mark!.y + mark!.height).toBeLessThanOrEqual(copy!.y);
  const search = await page.getByRole('searchbox').boundingBox();
  const key = await page.getByRole('button', { name: 'How to read a circle' }).boundingBox();
  expect(search!.x + search!.width).toBeLessThanOrEqual(390);
  expect(key!.x + key!.width).toBeLessThanOrEqual(390);
});

test('Works filters, search and empty state recover the collection', async ({ page }) => {
  const panels = page.locator('.wp-panel');
  await expect(panels).toHaveCount(68);
  await page.getByRole('button', { name: /Interface & Web/ }).click();
  await expect(panels).toHaveCount(9);
  await page.getByRole('searchbox').fill('Atelier');
  await expect(panels).toHaveCount(1);
  await expect(panels).toContainText('Atelier');
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(panels).toHaveCount(9);
  await page.getByRole('button', { name: /Awarded/ }).click();
  expect(await panels.count()).toBeLessThan(9);
  await page.getByRole('searchbox').fill('no-such-grimoire-work');
  await expect(page.getByText('No works match these filters.')).toBeVisible();
  await page.getByRole('button', { name: 'Show all works' }).click();
  await expect(panels).toHaveCount(68);
  await expect(page.getByRole('searchbox')).toHaveValue('');
});

test('project and circle key dialogs lock scrolling and restore keyboard focus', async ({ page }) => {
  for (const opener of [page.getByRole('button', { name: 'Atelier', exact: true }), page.getByRole('button', { name: 'How to read a circle' })]) {
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Shift+Tab');
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  }
  const panel = page.locator('.wp-panel').first();
  await panel.scrollIntoViewIfNeeded();
  await expect(panel.locator('.wp-panel-copy')).toHaveCSS('clip-path', 'none');
  await panel.getByRole('button').focus();
  await page.keyboard.press('Tab');
  await expect(panel.locator('.wp-panel-copy')).toHaveCSS('clip-path', 'none', { timeout: 150 });
});

test('panel content starts after its ink frame and reduced motion stays still', async ({ page }) => {
  const panel = page.locator('.wp-panel').first();
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toHaveAttribute('data-reveal', 'ready');
  const timing = await panel.evaluate(el => {
    const frame = getComputedStyle(el.querySelector('.wp-panel-frame rect')!);
    const content = getComputedStyle(el.querySelector('.wp-panel-copy')!);
    return { frameEnd: parseFloat(frame.animationDuration) + parseFloat(frame.animationDelay), contentStart: parseFloat(content.animationDelay) };
  });
  expect(timing.contentStart).toBeGreaterThanOrEqual(timing.frameEnd);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('.wp-panel-copy').first()).toHaveCSS('opacity', '1');
  expect(await page.locator('.wp-panel').first().evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
});
