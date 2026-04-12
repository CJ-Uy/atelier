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
});
