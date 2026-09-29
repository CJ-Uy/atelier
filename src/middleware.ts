import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';

const SOCIAL_REDIRECTS: Record<string, string> = {
  'in.cjuy.dev': 'https://www.linkedin.com/in/charles-joshua-uy-920826274/',
  'linkedin.cjuy.dev': 'https://www.linkedin.com/in/charles-joshua-uy-920826274/',
  'gh.cjuy.dev': 'https://github.com/CJ-Uy',
  'github.cjuy.dev': 'https://github.com/CJ-Uy',
  'fb.cjuy.dev': 'https://www.facebook.com/charlesjoshua.uy/',
  'facebook.cjuy.dev': 'https://www.facebook.com/charlesjoshua.uy/',
  'ig.cjuy.dev': 'https://www.instagram.com/uy_si_charles?stkn=ZnpieXFkNmpoYjJy&utm_source=qr',
};

const QR_IMAGES: Record<string, string> = {
  'gcashqr.cjuy.dev': '/gcash-qr.jpg',
  'igqr.cjuy.dev': '/ig-qr.jpg',
};

const CV_ASSET_PATH = '/cv/CV_Charles_Joshua_Uy.pdf';
const CV_DOWNLOAD_NAME = 'CV_CJ-Uy_Updated_2026-09-14.pdf';

export const onRequest = defineMiddleware(async (context, next) => {
  const host = context.url.hostname.toLowerCase();

  if (context.url.pathname === '/' && QR_IMAGES[host]) {
    return env.ASSETS.fetch(new URL(QR_IMAGES[host], context.url));
  }

  if (host === 'gcash.cjuy.dev' && context.url.pathname === '/') {
    return context.rewrite('/gcash');
  }

  if (host === 'cv.cjuy.dev' && context.url.pathname === '/') {
    const asset = await fetch(new URL(CV_ASSET_PATH, context.url));
    const headers = new Headers(asset.headers);

    headers.set('content-type', 'application/pdf');
    headers.set('content-disposition', `inline; filename="${CV_DOWNLOAD_NAME}"`);

    return new Response(asset.body, { status: asset.status, headers });
  }

  const destination = SOCIAL_REDIRECTS[host];

  if (destination) {
    return context.redirect(destination, 301);
  }

  return next();
});
