// src/lib/grid/ScrollOrchestrator.ts
import type { GridEngine } from './GridEngine';
import type { GridStateName, SectionChangedEvent } from './types';

interface SectionDef {
  gridState: GridStateName;
}

/**
 * Scroll-position-mapped morphing with JS-based snap.
 *
 * Every pixel of scroll = visible grid morph. Direct A→B interpolation.
 * No CSS scroll-snap (causes directional resistance / dead zones).
 * Instead: on scroll-end, smooth-animate to nearest section.
 */
export class ScrollOrchestrator {
  private engine: GridEngine;
  private sections: SectionDef[];
  private _currentIndex = 0;
  private _currentStateName: GridStateName = 'graphPaper';

  // GPU upload tracking — only upload when section pair changes
  private loadedFrom = -1;
  private loadedTo = -1;
  private lastDispatchedIndex = -1;

  // JS snap: debounce timer for scroll-end detection
  private snapTimer = 0;
  private isSnapping = false;
  private snapRaf = 0;
  private static readonly SNAP_DELAY = 120; // ms after last scroll event
  private static readonly SNAP_DURATION = 350; // ms for snap animation

  constructor(engine: GridEngine, sections: SectionDef[]) {
    this.engine = engine;
    this.sections = sections;
  }

  get currentIndex(): number { return this._currentIndex; }

  init(scrollContainer: HTMLElement): void {
    scrollContainer.addEventListener('scroll', () => {
      // Cancel any in-progress snap animation (user took over)
      if (this.isSnapping) {
        cancelAnimationFrame(this.snapRaf);
        this.isSnapping = false;
      }

      this._onScroll(scrollContainer);

      // Reset snap timer on every scroll event
      clearTimeout(this.snapTimer);
      this.snapTimer = window.setTimeout(() => {
        this._snapToNearest(scrollContainer);
      }, ScrollOrchestrator.SNAP_DELAY);
    }, { passive: true });

    // Initial render
    this._onScroll(scrollContainer);
  }

  /** Programmatic jump (from dot indicator clicks) */
  goToSection(index: number): void {
    const container = document.querySelector('.scroll-container') as HTMLElement | null;
    if (!container) return;
    const clamped = Math.max(0, Math.min(index, this.sections.length - 1));
    this._animateScrollTo(container, clamped * container.clientHeight);
  }

  private _onScroll(container: HTMLElement): void {
    const h = container.clientHeight;
    if (h === 0) return;

    const fraction = container.scrollTop / h;
    const maxIndex = this.sections.length - 1;

    const fromIdx = Math.min(Math.floor(fraction), maxIndex);
    const toIdx = Math.min(fromIdx + 1, maxIndex);
    const progress = Math.min(fraction - fromIdx, 1);

    const fromState = this.sections[fromIdx]?.gridState ?? 'graphPaper';
    const toState = this.sections[toIdx]?.gridState ?? 'graphPaper';

    // Only re-upload GPU buffers when the section pair changes
    if (fromIdx !== this.loadedFrom || toIdx !== this.loadedTo) {
      this.loadedFrom = fromIdx;
      this.loadedTo = toIdx;
      this.engine.setCurrent(fromState);
      this.engine.setTarget(toState);
    }

    // Every scroll tick → progress update (cheap uniform, no GPU upload)
    this.engine.setProgress(progress);

    // Dispatch section-change for HeroText at nearest section
    const nearestIdx = Math.min(Math.round(fraction), maxIndex);
    if (nearestIdx !== this.lastDispatchedIndex) {
      this.lastDispatchedIndex = nearestIdx;
      this._currentIndex = nearestIdx;
      this._currentStateName = this.sections[nearestIdx]?.gridState ?? 'graphPaper';
      const detail: SectionChangedEvent = {
        index: nearestIdx,
        stateName: this._currentStateName,
      };
      window.dispatchEvent(new CustomEvent('atelier:section-change', { detail }));
    }
  }

  /** Smooth-scroll to nearest section after user stops scrolling */
  private _snapToNearest(container: HTMLElement): void {
    const h = container.clientHeight;
    if (h === 0) return;

    const nearestIndex = Math.round(container.scrollTop / h);
    const targetScroll = nearestIndex * h;

    // Skip if already at target
    if (Math.abs(container.scrollTop - targetScroll) < 1) return;

    this._animateScrollTo(container, targetScroll);
  }

  /** Animate scroll position to target with easing */
  private _animateScrollTo(container: HTMLElement, target: number): void {
    this.isSnapping = true;
    const start = container.scrollTop;
    const distance = target - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / ScrollOrchestrator.SNAP_DURATION, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      container.scrollTop = start + distance * eased;

      if (t < 1) {
        this.snapRaf = requestAnimationFrame(tick);
      } else {
        this.isSnapping = false;
        container.scrollTop = target; // exact final position
        this._onScroll(container); // final state
      }
    };

    this.snapRaf = requestAnimationFrame(tick);
  }
}
