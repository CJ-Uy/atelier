import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ContactPage from '../ContactPage';

vi.mock('../../shared/MagicCircle', () => ({ default: () => React.createElement('svg', null,
  ...Array.from({ length: 5 }, (_, index) => React.createElement('circle', { key: index, className: 'mc-summon-node' })),
) }));

let container: HTMLDivElement;
let root: Root;
let intersect: IntersectionObserverCallback;
let motionChanged: () => void;
let reduced: boolean;
const frames = new Map<number, FrameRequestCallback>();
const disconnect = vi.fn();

beforeEach(() => {
  reduced = false;
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced; },
    addEventListener: (_: string, callback: () => void) => { motionChanged = callback; }, removeEventListener: vi.fn(),
  }));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { intersect = callback; }
    observe() {}
    disconnect = disconnect;
  });
  let frame = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++frame, callback); return frame; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(React.createElement(ContactPage)));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  frames.clear();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it('keeps all six destinations native, including touch and modified activation', () => {
  const links = container.querySelectorAll<HTMLAnchorElement>('[data-channel]');
  expect(links).toHaveLength(6);
  expect(links[0].getAttribute('href')).toBe('mailto:charlesjoshuauy@gmail.com');
  const github = container.querySelector<HTMLAnchorElement>('[data-channel="github"]')!;
  expect(github.href).toBe('https://github.com/CJ-Uy');
  const prevented: boolean[] = [];
  const observe = (event: MouseEvent) => { prevented.push(event.defaultPrevented); event.preventDefault(); };
  document.addEventListener('click', observe);
  for (const options of [{ detail: 1 }, { detail: 0 }, { detail: 1, ctrlKey: true }]) {
    act(() => github.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...options })));
  }
  document.removeEventListener('click', observe);
  expect(prevented).toEqual([false, false, false]);
  expect(container.querySelector('[aria-busy="true"]')).toBeNull();
});

it('draws the focused connection only while visible, stops for reduced motion, and cleans up', () => {
  act(() => container.querySelector<HTMLAnchorElement>('[data-channel="github"]')!.focus());
  expect(container.querySelector('[role="status"]')!.textContent).toContain('GitHub');
  expect(frames.size).toBe(0);
  act(() => intersect([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver));
  expect(frames.size).toBe(1);
  act(() => intersect([{ isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver));
  expect(frames.size).toBe(0);
  expect(container.querySelector<HTMLElement>('.cm-apparatus')!.dataset.paused).toBe('true');
  reduced = true;
  act(() => { intersect([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver); motionChanged(); });
  expect(frames.size).toBe(0);
  expect(container.querySelectorAll('.cm-flow')).toHaveLength(5);
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  expect(container.querySelectorAll('.cm-flow')).toHaveLength(0);
  expect(disconnect).toHaveBeenCalled();
});
