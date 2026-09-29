import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('GCash page shows the real QR and candles remember clicks', async ({ page }) => {
  await page.goto('/gcash');

  await expect(page.getByRole('heading', { name: /^gcash summoning circle$/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /original GCash InstaPay QR/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /funny Pinoy GCash summoning circle meme/i })).toBeVisible();

  const candle = page.getByRole('button', { name: /add a candle/i });
  await candle.click();
  await candle.click();
  await expect(page.locator('#candle-row')).toHaveText('🕯️🕯️');
  await page.reload();
  await expect(page.locator('#candle-row')).toHaveText('🕯️🕯️');

  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: /save qr/i }).click();
  expect((await download).suggestedFilename()).toBe('CJ-Uy-GCash-QR.jpg');
});

test('QR subdomains return their original JPEGs and Instagram redirects', async ({ request }) => {
  for (const [host, file] of [['gcashqr.cjuy.dev', 'gcash-qr.jpg'], ['igqr.cjuy.dev', 'ig-qr.jpg']]) {
    const response = await request.get('/', { headers: { Host: host } });
    expect(response.ok(), `${host}: ${response.status()} ${(await response.text()).slice(0, 120)}`).toBeTruthy();
    expect(response.headers()['content-type']).toContain('image/jpeg');
    expect(await response.body()).toEqual(await readFile(new URL(`../public/${file}`, import.meta.url)));
  }

  const meme = await request.get('/', { headers: { Host: 'gcash.cjuy.dev' } });
  expect(meme.ok()).toBeTruthy();
  expect((await meme.text()).includes('GCash summoning circle')).toBe(true);

  const instagram = await request.get('/', { headers: { Host: 'ig.cjuy.dev' }, maxRedirects: 0 });
  expect(instagram.status()).toBe(301);
  expect(instagram.headers().location).toBe('https://www.instagram.com/uy_si_charles?stkn=ZnpieXFkNmpoYjJy&utm_source=qr');
});

test('GCash page fits a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/gcash');
  await expect(page.getByRole('img', { name: /original GCash InstaPay QR/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
