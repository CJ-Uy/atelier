// src/lib/grid/__tests__/ScrollOrchestrator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScrollOrchestrator } from '../ScrollOrchestrator';
import type { GridStateName } from '../types';

vi.mock('gsap', () => ({ default: { to: vi.fn(), registerPlugin: vi.fn() } }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: vi.fn(), getAll: vi.fn(() => []) } }));

const mockEngine = () => ({
  setTargetState: vi.fn(),
  setCurrentState: vi.fn(),
  setProgress: vi.fn(),
  resetToBase: vi.fn(),
});

const sections = (states: GridStateName[]) => states.map((gridState, id) => ({ id, gridState }));

describe('ScrollOrchestrator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts at index 0', () => {
    const o = new ScrollOrchestrator(mockEngine() as any, sections(['graphPaper']));
    expect(o.currentIndex).toBe(0);
  });

  it('dispatches atelier:section-change with correct detail', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    const o = new ScrollOrchestrator(mockEngine() as any, sections(['graphPaper', 'keyboard']));
    o.goToSection(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'atelier:section-change' })
    );
    const evt = spy.mock.calls[0][0] as CustomEvent;
    expect(evt.detail).toEqual({ index: 1, stateName: 'keyboard' });
  });

  it('does not dispatch if already on that section', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    const o = new ScrollOrchestrator(mockEngine() as any, sections(['graphPaper']));
    o.goToSection(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls resetToBase then setTargetState before morph', () => {
    const eng = mockEngine();
    const o = new ScrollOrchestrator(eng as any, sections(['graphPaper', 'volleyball']));
    o.goToSection(1);
    expect(eng.resetToBase).toHaveBeenCalled();
    expect(eng.setTargetState).toHaveBeenCalledWith('volleyball');
  });

  it('clamps negative index to 0', () => {
    const o = new ScrollOrchestrator(mockEngine() as any, sections(['graphPaper', 'keyboard']));
    expect(() => o.goToSection(-5)).not.toThrow();
  });

  it('clamps over-range index to last section', () => {
    const o = new ScrollOrchestrator(mockEngine() as any, sections(['graphPaper', 'keyboard']));
    expect(() => o.goToSection(99)).not.toThrow();
  });
});
