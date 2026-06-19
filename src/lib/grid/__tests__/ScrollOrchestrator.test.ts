// src/lib/grid/__tests__/ScrollOrchestrator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScrollOrchestrator } from '../ScrollOrchestrator';
import type { GridStateName } from '../types';

const mockEngine = () => ({
  setTarget: vi.fn(),
  setCurrent: vi.fn(),
  setProgress: vi.fn(),
  resetToBase: vi.fn(),
  promoteTargetToCurrent: vi.fn(),
  setTargetState: vi.fn(),
  setCurrentState: vi.fn(),
});

const sections = (states: GridStateName[]) => states.map((gridState, id) => ({ id, gridState }));

describe('ScrollOrchestrator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    // Mock scroll-container for goToSection
    const mockContainer = document.createElement('div');
    mockContainer.className = 'scroll-container';
    document.body.appendChild(mockContainer);
  });

  it('starts at index 0', () => {
    const o = new ScrollOrchestrator(mockEngine() as any, sections(['graphPaper']));
    expect(o.currentIndex).toBe(0);
  });

  it('goToSection scrolls the container (does not throw)', () => {
    const o = new ScrollOrchestrator(mockEngine() as any, sections(['graphPaper', 'keyboard']));
    // goToSection now delegates to scrollIntoView — should not throw
    expect(() => o.goToSection(1)).not.toThrow();
  });

  it('handles negative index gracefully', () => {
    const o = new ScrollOrchestrator(mockEngine() as any, sections(['graphPaper', 'keyboard']));
    expect(() => o.goToSection(-5)).not.toThrow();
  });

  it('handles over-range index gracefully', () => {
    const o = new ScrollOrchestrator(mockEngine() as any, sections(['graphPaper', 'keyboard']));
    expect(() => o.goToSection(99)).not.toThrow();
  });

  it('init attaches scroll listener without error', () => {
    const eng = mockEngine();
    const o = new ScrollOrchestrator(eng as any, sections(['graphPaper', 'keyboard']));
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientHeight', { value: 800 });
    Object.defineProperty(container, 'scrollTop', { value: 0 });
    expect(() => o.init(container)).not.toThrow();
  });

  it('sets engine state on scroll event (settled at section 0)', () => {
    const eng = mockEngine();
    const o = new ScrollOrchestrator(eng as any, sections(['graphPaper', 'keyboard']));
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientHeight', { value: 800 });
    Object.defineProperty(container, 'scrollTop', { value: 0 });
    o.init(container);
    // Simulate scroll event at position 0 (settled on section 0)
    container.dispatchEvent(new Event('scroll'));
    expect(eng.setCurrent).toHaveBeenCalledWith('graphPaper');
  });

  it('coalesces multiple scroll events into one progress update per frame', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    }));

    const eng = mockEngine();
    const requestRender = vi.fn();
    const o = new ScrollOrchestrator(
      eng as any,
      sections(['graphPaper', 'keyboard']),
      requestRender,
    );
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientHeight', { value: 800 });
    Object.defineProperty(container, 'scrollTop', { value: 240, writable: true });
    o.init(container);
    eng.setProgress.mockClear();
    requestRender.mockClear();

    container.dispatchEvent(new Event('scroll'));
    container.dispatchEvent(new Event('scroll'));
    container.dispatchEvent(new Event('scroll'));

    expect(eng.setProgress).not.toHaveBeenCalled();
    frames.shift()?.(16);
    expect(eng.setProgress).toHaveBeenCalledTimes(1);
    expect(requestRender).toHaveBeenCalledTimes(1);
  });

  it('cancels a running snap when new wheel input arrives', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 42));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const container = document.querySelector('.scroll-container') as HTMLElement;
    Object.defineProperty(container, 'clientHeight', { value: 800 });
    Object.defineProperty(container, 'scrollTop', { value: 120, writable: true });
    const o = new ScrollOrchestrator(
      mockEngine() as any,
      sections(['graphPaper', 'keyboard']),
    );
    o.init(container);
    o.goToSection(1);

    container.dispatchEvent(new WheelEvent('wheel'));

    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
  });

  it('waits through brief trackpad pauses before starting a snap', () => {
    vi.useFakeTimers();
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    }));

    const container = document.createElement('div');
    Object.defineProperty(container, 'clientHeight', { value: 800 });
    Object.defineProperty(container, 'scrollTop', { value: 240, writable: true });
    const o = new ScrollOrchestrator(
      mockEngine() as any,
      sections(['graphPaper', 'keyboard']),
    );
    o.init(container);
    container.dispatchEvent(new Event('scroll'));
    frames.shift()?.(16);
    vi.mocked(requestAnimationFrame).mockClear();

    vi.advanceTimersByTime(150);
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    vi.advanceTimersByTime(30);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
