// Run: node src/components/contact/__tests__/contact.test.mjs
// Exercise the real TSX in-process using Astro's installed TypeScript compiler.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve('astro/package.json'));
const ts = astroRequire('typescript');
const modules = new Map();

function loadTsx(filename) {
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const localRequire = createRequire(filename);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(
    (specifier) => specifier.startsWith('.')
      ? loadTsx(resolve(dirname(filename), `${specifier}.tsx`))
      : localRequire(specifier),
    module,
    module.exports,
  );
  return module.exports;
}

const ContactPage = loadTsx(fileURLToPath(new URL('../ContactPage.tsx', import.meta.url))).default;

test('contact preserves native links and completes or cancels one touch ritual', async (t) => {
  const ssr = renderToString(React.createElement(ContactPage));
  const dom = new JSDOM(`<div id="root">${ssr}</div>`, {
    url: 'https://atelier.test/contact', pretendToBeVisual: true,
  });
  const expectedLinks = {
    email: 'mailto:charlesjoshuauy@gmail.com', github: 'https://github.com/CJ-Uy',
    linkedin: 'https://www.linkedin.com/in/charles-joshua-uy-920826274/',
    phone: 'tel:+639171504686', cv: 'https://cv.cjuy.dev',
    facebook: 'https://facebook.com/charlesjoshua.uy',
  };
  assert.equal(dom.window.document.querySelectorAll('[data-channel]').length, 6);
  for (const [id, href] of Object.entries(expectedLinks)) {
    assert.equal(dom.window.document.querySelector(`[data-channel="${id}"]`).getAttribute('href'), href);
  }

  const saved = new Map();
  for (const [key, value] of Object.entries({
    window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  let reducedMotion = false;
  dom.window.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : query.includes('hover: none'),
  });
  const frames = new Map();
  let nextFrame = 0;
  for (const [key, value] of Object.entries({
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
  })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let blocked = false;
  const opened = [];
  const destinations = [];
  const popup = { opener: {}, location: { replace: (href) => destinations.push(href) } };
  dom.window.open = (...args) => { opened.push(args); return blocked ? null : popup; };
  let handled;
  // Observe React's decision, then suppress jsdom's unsupported native navigation.
  dom.window.document.addEventListener('click', (event) => {
    handled = event.defaultPrevented;
    event.preventDefault();
  });
  const container = dom.window.document.getElementById('root');
  let root;
  let mounted = true;
  t.after(async () => {
    if (mounted && root) await act(async () => root.unmount());
    t.mock.timers.reset();
    dom.window.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const hydrationErrors = [];
  await act(async () => {
    root = hydrateRoot(container, React.createElement(ContactPage), {
      onRecoverableError: (error) => hydrationErrors.push(error),
    });
  });
  assert.deepEqual(hydrationErrors, [], 'server markup must hydrate without mismatches');
  const find = (selector) => {
    const element = container.querySelector(selector);
    assert.ok(element, `Missing ${selector}`);
    return element;
  };
  const tap = async (selector, options = {}) => {
    handled = undefined;
    await act(async () => find(selector).dispatchEvent(new dom.window.MouseEvent('click', {
      bubbles: true, cancelable: true, detail: 1, button: 0, ...options,
    })));
    return handled;
  };
  const advance = (ms) => act(async () => t.mock.timers.tick(ms));
  const busy = () => find('.cm-apparatus').getAttribute('aria-busy');

  assert.equal(await tap('[data-channel="github"]'), true);
  assert.equal(busy(), 'true');
  assert.match(find('[role="status"]').textContent, /Channelling GitHub/);
  await advance(1499);
  assert.equal(opened.length, 0, 'destination must wait for the full ritual');
  assert.equal(await tap('[data-channel="linkedin"]'), true);
  assert.match(find('[role="status"]').textContent, /GitHub/, 'repeat tap must keep the first channel');
  await advance(1);
  assert.deepEqual(opened, [['about:blank', '_blank']]);
  assert.deepEqual(destinations, [expectedLinks.github]);
  assert.equal(popup.opener, null);
  assert.equal(busy(), 'false');
  assert.equal(frames.size, 0);
  await advance(1500);
  assert.equal(opened.length, 1, 'repeat taps must not schedule a second opening');

  blocked = true;
  await tap('[data-channel="cv"]');
  await advance(1500);
  const fallback = find('.cm-open-channel');
  assert.equal(fallback.getAttribute('href'), expectedLinks.cv);
  assert.equal(fallback.getAttribute('target'), '_blank');
  assert.match(fallback.getAttribute('rel'), /noopener/);
  assert.equal(await tap('.cm-open-channel'), false, 'fallback must remain a native link');
  const completedOpenings = opened.length;

  reducedMotion = true;
  assert.equal(await tap('[data-channel="github"]'), false);
  assert.equal(busy(), 'false');
  reducedMotion = false;
  assert.equal(await tap('[data-channel="github"]', { detail: 0 }), false, 'keyboard links remain native');
  assert.equal(await tap('[data-channel="github"]', { ctrlKey: true }), false, 'modified links remain native');
  await advance(1500);
  assert.equal(opened.length, completedOpenings);

  blocked = false;
  await tap('[data-channel="linkedin"]');
  await tap('.cm-cancel');
  assert.equal(busy(), 'false');
  assert.equal(frames.size, 0);
  await advance(1500);
  assert.equal(opened.length, completedOpenings, 'cancel must clear the opening timer');

  await tap('[data-channel="github"]');
  await act(async () => dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' })));
  await advance(1500);
  assert.equal(busy(), 'false');
  assert.equal(opened.length, completedOpenings, 'Escape must cancel the ritual');

  await tap('[data-channel="github"]');
  await act(async () => {
    Object.defineProperty(dom.window.document, 'hidden', { configurable: true, value: true });
    dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
  });
  await advance(1500);
  assert.equal(busy(), 'false');
  assert.equal(opened.length, completedOpenings, 'backgrounding must cancel the ritual');
  Object.defineProperty(dom.window.document, 'hidden', { configurable: true, value: false });

  await tap('[data-channel="github"]');
  await act(async () => root.unmount());
  mounted = false;
  await advance(1500);
  assert.equal(opened.length, completedOpenings, 'unmount must clear the opening timer');
  assert.equal(frames.size, 0, 'unmount must cancel animation frames');
});
