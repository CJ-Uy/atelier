// tests/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.scroll-container');
  });

  test('canvas is attached with non-zero dimensions', async ({ page }) => {
    const canvas = page.locator('#grid-canvas');
    await expect(canvas).toBeAttached();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('hero text shows "Charles" on load', async ({ page }) => {
    const h1 = page.locator('h1').first();
    await expect(h1).toContainText('Charles', { timeout: 5000 });
  });

  test('renders exactly 8 section indicators', async ({ page }) => {
    const indicators = page.locator('nav[aria-label="Section navigation"] .indicator');
    await expect(indicators).toHaveCount(8);
  });

  test('first section indicator is active', async ({ page }) => {
    const first = page.locator('.indicator').first();
    await expect(first).toHaveClass(/active/);
  });

  test('navbar shows "atelier" wordmark', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
    await expect(nav).toContainText('atelier');
  });

  test('publishes the selected render quality for diagnostics', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute(
      'data-render-quality',
      /^(high|balanced|economy)$/,
    );
  });

  test('clicking second indicator updates active state', async ({ page }) => {
    const second = page.locator('.indicator').nth(1);
    await second.click();
    await page.waitForTimeout(500);
    await expect(second).toHaveClass(/active/);
  });

  test('hero follows the latest section when direction changes mid-transition', async ({ page }) => {
    await expect(page.locator('.descriptor')).toContainText('Charles');
    await page.evaluate(() => {
      const change = (index: number) => window.dispatchEvent(
        new CustomEvent('atelier:grid-progress', { detail: { index, progress: 0, fade: 1 } }),
      );
      change(1);
      setTimeout(() => change(0), 80);
    });
    await page.waitForTimeout(500);
    await expect(page.locator('.descriptor')).toContainText('Charles');
  });

  test('ink, identity and paper follow one reversible scroll gesture', async ({ page }) => {
    await expect(page.locator('.descriptor')).toHaveText('Charles');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('atelier:grid-progress', {
      detail: { index: 1, stateName: 'web', progress: 0.5, fade: 1 },
    })));
    await expect(page.locator('.descriptor')).toHaveText('developer');
    await expect(page.locator('.descriptor')).toHaveCSS('opacity', '0');
    await expect(page.locator('.facet-diagram')).toHaveCSS('opacity', '0');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('atelier:grid-progress', {
      detail: { index: 0, stateName: 'face', progress: 0, fade: 1 },
    })));
    await expect(page.locator('.descriptor')).toHaveText('Charles');
    await expect(page.locator('.descriptor')).toHaveCSS('opacity', '1');
    expect(await page.locator('.sticker-field').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  });

  test('scroll container has 8 section children', async ({ page }) => {
    const sections = page.locator('.scroll-container .scroll-section');
    await expect(sections).toHaveCount(8);
  });

  test('meta description is set', async ({ page }) => {
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute('content', /Portfolio of Charles/);
  });
});

test('reduced motion selects economy rendering', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-render-quality', 'economy');
});

test('Space activates the focused section and reduced-motion jumps are immediate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const developer = page.getByRole('button', { name: 'Go to developer', exact: true });
  await expect(developer).toBeVisible();
  await page.getByRole('button', { name: 'Go to big dreamer', exact: true }).click();
  await expect(page.locator('.descriptor')).toHaveText('big dreamer');
  await developer.focus();
  await page.keyboard.press('Space');
  await expect(developer).toHaveAttribute('aria-current', 'true');
  await expect(developer).toBeFocused();
  expect(await page.evaluate(() => {
    (document.querySelector('.indicator') as HTMLButtonElement).click();
    return document.querySelector('.scroll-container')!.scrollTop;
  })).toBe(0);
});

test('mobile navigation fits and provides touch-sized targets', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const links = page.locator('nav[aria-label="Main navigation"] a, .indicator');
  await expect(page.locator('.indicator')).toHaveCount(8);
  for (const link of await links.all()) {
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  expect(await page.locator('.scroll-container').evaluate(
    (element) => element.scrollWidth <= element.clientWidth,
  )).toBe(true);
});
