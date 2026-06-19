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
