import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/works');
  await page.locator('astro-island[component-url*="WorksPage"]:not([ssr])').waitFor();
  await expect(page.locator('.wp-grid')).toHaveAttribute('data-arranged', 'true');
});

test('mobile Works header and controls fit without overlap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('img', { name: /Search sigil/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const mark = await page.locator('.ph-circlemark').boundingBox();
  const copy = await page.locator('.ph-sub').boundingBox();
  expect(mark!.y + mark!.height).toBeLessThanOrEqual(copy!.y);
  const search = await page.getByRole('searchbox').boundingBox();
  const key = await page.getByRole('img', { name: /Search sigil/ }).boundingBox();
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

test('project sheets lock scrolling and return the selected sigil and keyboard focus', async ({ page }) => {
  for (const opener of [page.getByRole('button', { name: 'Atelier', exact: true })]) {
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

test('the search sigil builds with filters and shuffling keeps the current search', async ({ page }) => {
  const sigil = page.getByRole('img', { name: /Search sigil/ });
  await expect(sigil).toHaveAttribute('aria-label', /blank circle/);
  await expect(sigil.locator('svg circle')).toHaveCount(1);
  await expect(page.getByText('How to read a circle')).toHaveCount(0);
  const original = await page.locator('.wp-panel').evaluateAll(panels => panels.map(panel => panel.getAttribute('data-work')));
  await page.getByRole('button', { name: 'Shuffle panels' }).click();
  const shuffled = await page.locator('.wp-panel').evaluateAll(panels => panels.map(panel => panel.getAttribute('data-work')));
  expect(shuffled).not.toEqual(original);
  expect([...shuffled].sort()).toEqual([...original].sort());
  await page.getByRole('button', { name: /Interface & Web/ }).click();
  await expect(sigil).toHaveAttribute('aria-label', /Interface & Web/);
  await page.getByRole('searchbox').fill('Atelier');
  await expect(sigil).toHaveAttribute('aria-label', /Search: Atelier/);
  await page.getByRole('button', { name: 'Shuffle panels' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('Atelier');
  await expect(page.locator('.wp-panel')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(sigil).toHaveAttribute('aria-label', /blank circle/);
  await expect(page.locator('.wp-panel')).toHaveCount(68);
});

test('the selected panel and sigil complete native open and close transitions', async ({ page }) => {
  test.skip(!await page.evaluate(() => Boolean(document.startViewTransition)), 'View transitions unavailable');
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => {
      document.documentElement.dataset.transition = 'pending';
      const view = start(update);
      void view.ready.then(
        () => { document.documentElement.dataset.transition = 'ready'; },
        (error) => { document.documentElement.dataset.transition = String(error); },
      );
      return view;
    };
  });
  const panel = page.locator('.wp-panel').first();
  await panel.getByRole('button').click();
  await expect(page.locator('html')).toHaveAttribute('data-transition', 'ready');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-transition', 'ready');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => panel.evaluate(el => el.style.viewTransitionName)).toBe('');
  await expect.poll(() => panel.locator('.wp-panel-circle').evaluate(el => (el as HTMLElement).style.viewTransitionName)).toBe('');
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
