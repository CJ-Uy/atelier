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

  test('renders exactly 13 dot buttons', async ({ page }) => {
    const dots = page.locator('nav[aria-label="Section navigation"] .dot');
    await expect(dots).toHaveCount(13);
  });

  test('first dot is active', async ({ page }) => {
    const first = page.locator('.dot').first();
    await expect(first).toHaveClass(/active/);
  });

  test('navbar shows "atelier" wordmark', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
    await expect(nav).toContainText('atelier');
  });

  test('theme toggle switches data-theme to light', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    const toggle = page.locator('button[aria-label*="mode"]');
    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('clicking second dot updates active state', async ({ page }) => {
    const second = page.locator('.dot').nth(1);
    await second.click();
    await page.waitForTimeout(500);
    await expect(second).toHaveClass(/active/);
  });

  test('scroll container has 13 section children', async ({ page }) => {
    const sections = page.locator('.scroll-container .scroll-section');
    await expect(sections).toHaveCount(13);
  });

  test('meta description is set', async ({ page }) => {
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute('content', /Portfolio of Charles/);
  });
});
