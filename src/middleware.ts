import { defineMiddleware } from 'astro:middleware';

const SOCIAL_REDIRECTS: Record<string, string> = {
  'in.cjuy.dev': 'https://www.linkedin.com/in/charles-joshua-uy-920826274/',
  'linkedin.cjuy.dev': 'https://www.linkedin.com/in/charles-joshua-uy-920826274/',
  'gh.cjuy.dev': 'https://github.com/CJ-Uy',
  'github.cjuy.dev': 'https://github.com/CJ-Uy',
  'fb.cjuy.dev': 'https://www.facebook.com/charlesjoshua.uy/',
  'facebook.cjuy.dev': 'https://www.facebook.com/charlesjoshua.uy/',
};

export const onRequest = defineMiddleware((context, next) => {
  if (context.url.hostname.toLowerCase() === 'cv.cjuy.dev' && context.url.pathname === '/') {
    return context.redirect('/cv.pdf', 302);
  }

  const destination = SOCIAL_REDIRECTS[context.url.hostname.toLowerCase()];

  if (destination) {
    return context.redirect(destination, 301);
  }

  return next();
});
