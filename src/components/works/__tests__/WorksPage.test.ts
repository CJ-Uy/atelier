import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WorksPage from '../WorksPage';
import { WORKS } from '../works.data';

vi.mock('../../shared/MagicCircle', () => ({ default: (props: { variant: string; overlays?: string[]; origin?: boolean }) => React.createElement('svg', {
  'data-variant': props.variant, 'data-overlays': props.overlays?.join(','), 'data-origin': String(!!props.origin),
}) }));

describe('Works panels', () => {
  let container: HTMLDivElement;
  let root: Root;
  let intersect: IntersectionObserverCallback;
  const observe = vi.fn();
  const unobserve = vi.fn();
  const disconnect = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { intersect = callback; }
      observe = observe;
      unobserve = unobserve;
      disconnect = disconnect;
    });
    // jsdom does not implement the native dialog methods.
    HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    HTMLDialogElement.prototype.close = function () { this.open = false; };
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('prints only intersecting panels, with one observer and no timed offscreen reveal', () => {
    act(() => root.render(React.createElement(WorksPage)));
    const panels = container.querySelectorAll<HTMLElement>('.wp-panel');
    expect(observe).toHaveBeenCalledTimes(WORKS.length);
    intersect([{ target: panels[0], isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver);
    expect(panels[0].dataset.reveal).toBe('ready');
    expect(unobserve).toHaveBeenCalledWith(panels[0]);
    act(() => vi.advanceTimersByTime(3000));
    expect(panels[1].dataset.reveal).toBe('pending');
    act(() => root.unmount());
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('keeps panels immediately readable when reduced motion is requested', () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    act(() => root.render(React.createElement(WorksPage)));
    expect(observe).not.toHaveBeenCalled();
    expect(container.querySelector('.wp-panel')?.hasAttribute('data-reveal')).toBe(false);
  });

  it('opens a native project dialog and restores scrolling on Escape', () => {
    act(() => root.render(React.createElement(WorksPage)));
    const opener = container.querySelector<HTMLButtonElement>('.wp-panel-open')!;
    expect(opener.getAttribute('aria-haspopup')).toBe('dialog');
    act(() => opener.click());
    const dialog = container.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe(opener.textContent);
    expect(document.body.style.overflow).toBe('hidden');
    act(() => dialog.dispatchEvent(new Event('cancel', { cancelable: true })));
    expect(container.querySelector('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('announces filter selection and lets an empty collection reset all filters', () => {
    act(() => root.render(React.createElement(WorksPage)));
    const category = [...container.querySelectorAll<HTMLButtonElement>('.wp-categories button')].find((button) => button.textContent?.includes('AI & Agents'))!;
    act(() => category.click());
    expect(category.getAttribute('aria-pressed')).toBe('true');
    const early = [...container.querySelectorAll<HTMLButtonElement>('.wp-attributes button')].find((button) => button.textContent?.includes('Early Web'))!;
    act(() => early.click());
    expect(container.querySelectorAll('.wp-panel')).toHaveLength(0);
    const reset = container.querySelector<HTMLButtonElement>('.wp-empty button')!;
    expect(reset.textContent).toBe('Show all works');
    act(() => reset.click());
    expect(container.querySelectorAll('.wp-panel')).toHaveLength(WORKS.length);
    expect(container.querySelector('.wp-attributes [aria-pressed="true"]')).toBeNull();
  });

  it('builds the search sigil from selected filters and resets it to a blank circle', () => {
    act(() => root.render(React.createElement(WorksPage)));
    const sigil = () => container.querySelector('.wp-search-sigil svg')!;
    expect(sigil().getAttribute('data-variant')).toBe('blank');
    const category = [...container.querySelectorAll<HTMLButtonElement>('.wp-categories button')].find(button => button.textContent?.includes('Research'))!;
    act(() => category.click());
    expect(sigil().getAttribute('data-variant')).not.toBe('blank');
    const award = container.querySelector<HTMLButtonElement>('.wp-attributes button')!;
    act(() => award.click());
    expect(sigil().getAttribute('data-overlays')).toBe('seal');
    act(() => container.querySelector<HTMLButtonElement>('.wp-reset')!.click());
    expect(sigil().getAttribute('data-variant')).toBe('blank');
    expect(sigil().getAttribute('data-overlays')).toBe('');
    expect(container.querySelectorAll('.wp-panel')).toHaveLength(WORKS.length);
    expect(container.textContent).not.toContain('How to read a circle');
  });
});
